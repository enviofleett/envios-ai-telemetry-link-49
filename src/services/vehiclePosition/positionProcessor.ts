
import type { VehicleRecord, ProcessingResult, BatchProcessingResult } from './types';
import { SessionManager } from './sessionManager';
import { GP51ApiClient } from './gp51ApiClient';
import { BatchProcessor } from './batchProcessor';

export class VehiclePositionProcessor {
  private readonly BATCH_SIZE = 500;
  private readonly MAX_CONCURRENT_BATCHES = 3;
  
  private sessionManager = new SessionManager();
  private apiClient = new GP51ApiClient();
  private batchProcessor = new BatchProcessor();

  async fetchAndUpdateVehiclePositions(vehicles: VehicleRecord[]): Promise<ProcessingResult> {
    console.log(`Starting enhanced position fetch for ${vehicles.length} vehicles`);
    
    let totalUpdatedCount = 0;
    let totalErrors = 0;
    let totalProcessed = 0;
    const startTime = Date.now();

    try {
      const session = await this.sessionManager.getValidSession();
      console.log(`Using GP51 session for user: ${session.username}`);

      const deviceIds = vehicles.map(v => v.device_id);
      const batches = this.batchProcessor.createBatches(deviceIds, this.BATCH_SIZE);
      
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
              totalErrors += this.BATCH_SIZE;
              totalProcessed += this.BATCH_SIZE;
            }
          }

          if (i + this.MAX_CONCURRENT_BATCHES < batches.length) {
            await this.batchProcessor.delay(2000);
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

  private async processBatchWithRetry(deviceIds: string[], token: string, batchNumber: number, maxRetries: number = 2): Promise<BatchProcessingResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        console.log(`Processing batch ${batchNumber}, attempt ${attempt}/${maxRetries + 1} with ${deviceIds.length} devices`);
        const positions = await this.apiClient.fetchPositions(deviceIds, token);
        console.log(`Received ${positions.length} position records from GP51 for batch of ${deviceIds.length} devices`);
        
        const result = await this.batchProcessor.processBatch(positions);
        return { ...result, batchSize: deviceIds.length };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`Batch ${batchNumber} attempt ${attempt} failed:`, lastError.message);
        
        if (attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Retrying batch ${batchNumber} in ${delay}ms...`);
          await this.batchProcessor.delay(delay);
        }
      }
    }

    console.error(`Batch ${batchNumber} failed after ${maxRetries + 1} attempts:`, lastError?.message);
    return { updatedCount: 0, errors: deviceIds.length, batchSize: deviceIds.length };
  }
}

export const vehiclePositionProcessor = new VehiclePositionProcessor();
