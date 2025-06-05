
import { supabase } from '@/integrations/supabase/client';

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
}

export class VehiclePositionProcessor {
  private readonly BATCH_SIZE = 500; // GP51 API batch limit
  
  async fetchAndUpdateVehiclePositions(vehicles: VehicleRecord[]): Promise<ProcessingResult> {
    console.log(`Starting position fetch for ${vehicles.length} vehicles`);
    
    let totalUpdatedCount = 0;
    let totalErrors = 0;
    let totalProcessed = 0;

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

      // Process vehicles in batches to handle GP51 API limits
      const deviceIds = vehicles.map(v => v.device_id);
      const batches = this.createBatches(deviceIds, this.BATCH_SIZE);
      
      console.log(`Processing ${vehicles.length} vehicles in ${batches.length} batches of max ${this.BATCH_SIZE}`);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} vehicles`);
        
        try {
          const batchResult = await this.processBatch(batch, session.gp51_token);
          totalUpdatedCount += batchResult.updatedCount;
          totalErrors += batchResult.errors;
          totalProcessed += batch.length;
          
          // Add delay between batches to respect rate limits
          if (i < batches.length - 1) {
            await this.delay(1000); // 1 second delay between batches
          }
        } catch (error) {
          console.error(`Batch ${i + 1} failed:`, error);
          totalErrors += batch.length;
          totalProcessed += batch.length;
        }
      }

      console.log(`Position update completed: ${totalUpdatedCount} updated, ${totalErrors} errors, ${totalProcessed} processed of ${vehicles.length} requested`);

    } catch (error) {
      console.error('Position fetch failed:', error);
      throw new Error(`Failed to fetch positions from GP51: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return { 
      updatedCount: totalUpdatedCount, 
      errors: totalErrors,
      totalProcessed,
      totalRequested: vehicles.length
    };
  }

  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(deviceIds: string[], token: string): Promise<{ updatedCount: number; errors: number }> {
    const positionPayload = {
      deviceids: deviceIds,
      lastquerypositiontime: ""
    };

    const response = await fetch(`https://www.gps51.com/webapi?action=lastposition&token=${encodeURIComponent(token)}`, {
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

    // Update vehicle positions in database
    for (const position of positions) {
      try {
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({
            last_position: {
              lat: position.callat,
              lon: position.callon,
              speed: position.speed,
              course: position.course,
              updatetime: position.updatetime,
              statusText: position.strstatusen
            },
            updated_at: new Date().toISOString()
          })
          .eq('device_id', position.deviceid);

        if (updateError) {
          console.error(`Failed to update vehicle ${position.deviceid}:`, updateError);
          errors++;
        } else {
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error updating vehicle ${position.deviceid}:`, error);
        errors++;
      }
    }

    return { updatedCount, errors };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const vehiclePositionProcessor = new VehiclePositionProcessor();
