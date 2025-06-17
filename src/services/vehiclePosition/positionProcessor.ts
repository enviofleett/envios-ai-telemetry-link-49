

import { supabase } from '@/integrations/supabase/client';

// Configuration for GP51 API endpoint
const GP51_API_BASE = 'https://api.gps51.com';

interface VehicleRecord {
  device_id: string;
  device_name: string;
  is_active: boolean;
  gp51_username: string;
}

interface ProcessingResult {
  updatedCount: number;
  errors: number;
  totalProcessed: number;
  totalRequested: number;
  completionRate: number;
  avgProcessingTime: number;
}

// Renamed to avoid type collision with VehicleUpdate from src/types/vehicle.ts
interface VehiclePositionUpdate {
  device_id: string;
  last_position: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
  updated_at: string;
}

export class VehiclePositionProcessor {
  private readonly BATCH_SIZE = 500; // GP51 API batch limit
  private readonly MAX_CONCURRENT_BATCHES = 3; // Process multiple batches concurrently
  
  async fetchAndUpdateVehiclePositions(vehicles: VehicleRecord[]): Promise<ProcessingResult> {
    console.log(`Starting enhanced position fetch for ${vehicles.length} vehicles`);
    
    let totalUpdatedCount = 0;
    let totalErrors = 0;
    let totalProcessed = 0;
    const startTime = Date.now();

    try {
      // Get active GP51 session
      const { data: session, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('gp51_token, username, token_expires_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sessionError || !session) {
        throw new Error('No active GP51 session found');
      }

      // Check if token is still valid
      if (new Date(session.token_expires_at) < new Date()) {
        throw new Error('GP51 session token has expired');
      }

      console.log(`Using GP51 session for user: ${session.username}`);

      // Create batches for all vehicles
      const deviceIds = vehicles.map(v => v.device_id);
      const batches = this.createBatches(deviceIds, this.BATCH_SIZE);
      
      console.log(`Processing ${vehicles.length} vehicles in ${batches.length} batches of max ${this.BATCH_SIZE}`);

      // Process batches with controlled concurrency
      for (let i = 0; i < batches.length; i += this.MAX_CONCURRENT_BATCHES) {
        const batchGroup = batches.slice(i, i + this.MAX_CONCURRENT_BATCHES);
        
        console.log(`Processing batch group ${Math.floor(i / this.MAX_CONCURRENT_BATCHES) + 1}/${Math.ceil(batches.length / this.MAX_CONCURRENT_BATCHES)} with ${batchGroup.length} batches`);
        
        const batchPromises = batchGroup.map((batch, batchIndex) => 
          this.processBatchWithRetry(batch, session.gp51_token, i + batchIndex + 1)
        );

        try {
          const batchResults = await Promise.allSettled(batchPromises);
          
          for (const result of batchResults) {
            if (result.status === 'fulfilled') {
              totalUpdatedCount += result.value.updatedCount;
              totalErrors += result.value.errors;
              totalProcessed += result.value.batchSize;
            } else {
              console.error('Batch processing failed:', result.reason);
              totalErrors += this.BATCH_SIZE; // Assume full batch failed
              totalProcessed += this.BATCH_SIZE;
            }
          }

          // Add delay between batch groups to respect rate limits
          if (i + this.MAX_CONCURRENT_BATCHES < batches.length) {
            await this.delay(2000); // 2 second delay between batch groups
          }
        } catch (error) {
          console.error(`Batch group ${Math.floor(i / this.MAX_CONCURRENT_BATCHES) + 1} failed:`, error);
          totalErrors += batchGroup.length * this.BATCH_SIZE;
          totalProcessed += batchGroup.length * this.BATCH_SIZE;
        }
      }

      const processingTime = Date.now() - startTime;
      const completionRate = totalProcessed > 0 ? (totalUpdatedCount / totalProcessed) * 100 : 0;
      const avgProcessingTime = totalProcessed > 0 ? processingTime / totalProcessed : 0;

      console.log(`Enhanced position update completed: ${totalUpdatedCount} updated, ${totalErrors} errors, ${totalProcessed} processed of ${vehicles.length} requested`);
      console.log(`Completion rate: ${completionRate.toFixed(2)}%, Average processing time: ${avgProcessingTime.toFixed(2)}ms per vehicle`);

    } catch (error) {
      console.error('Position fetch failed:', error);
      throw new Error(`Failed to fetch positions from GP51: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    const processingTime = Date.now() - startTime;
    const completionRate = totalProcessed > 0 ? (totalUpdatedCount / totalProcessed) * 100 : 0;
    const avgProcessingTime = totalProcessed > 0 ? processingTime / totalProcessed : 0;

    return { 
      updatedCount: totalUpdatedCount, 
      errors: totalErrors,
      totalProcessed,
      totalRequested: vehicles.length,
      completionRate,
      avgProcessingTime
    };
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatchWithRetry(deviceIds: string[], token: string, batchNumber: number, maxRetries: number = 2): Promise<{ updatedCount: number; errors: number; batchSize: number }> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`Processing batch ${batchNumber}, attempt ${attempt}/${maxRetries + 1} with ${deviceIds.length} devices`);
        const result = await this.processBatch(deviceIds, token);
        return { ...result, batchSize: deviceIds.length };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Batch ${batchNumber} attempt ${attempt} failed:`, lastError.message);
        
        if (attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retrying batch ${batchNumber} in ${delay}ms...`);
          await this.delay(delay);
        }
      }
    }

    console.error(`Batch ${batchNumber} failed after ${maxRetries + 1} attempts:`, lastError?.message);
    return { updatedCount: 0, errors: deviceIds.length, batchSize: deviceIds.length };
  }

  private async processBatch(deviceIds: string[], token: string): Promise<{ updatedCount: number; errors: number }> {
    const positionPayload = {
      deviceids: deviceIds,
      lastquerypositiontime: ""
    };

    const response = await fetch(`${GP51_API_BASE}/webapi?action=lastposition&token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(positionPayload),
    });

    if (!response.ok) {
      throw new Error(`GP51 API request failed: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.status !== 0) {
      throw new Error(`GP51 API error: ${result.cause || 'Unknown error'}`);
    }

    const positions = result.records || [];
    console.log(`Received ${positions.length} position records from GP51 for batch of ${deviceIds.length} devices`);

    let updatedCount = 0;
    let errors = 0;

    // Bulk update approach for better performance
    const updates: VehiclePositionUpdate[] = positions.map(position => ({
      device_id: position.deviceid,
      last_position: {
        lat: position.callat,
        lon: position.callon,
        speed: position.speed,
        course: position.course,
        updatetime: position.updatetime,
        statusText: position.strstatusen
      },
      updated_at: new Date().toISOString()
    }));

    // Process updates in smaller chunks for better database performance
    // FIX: Explicitly type the generic parameter to avoid TS2589 error
    const updateChunks = this.createBatches<VehiclePositionUpdate>(updates, 100);
    
    for (const chunk of updateChunks) {
      try {
        for (const update of chunk) {
          // FINAL TS2589 FIX: Cast the update object to any to bypass deep type inference
          const { error: updateError } = await supabase
            .from('vehicles')
            .update(update as any)
            .eq('device_id', update.device_id);

          if (updateError) {
            console.error(`Failed to update vehicle ${update.device_id}:`, updateError);
            errors++;
          } else {
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error updating chunk:`, error);
        errors += chunk.length;
      }
    }

    return { updatedCount, errors };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const vehiclePositionProcessor = new VehiclePositionProcessor();

