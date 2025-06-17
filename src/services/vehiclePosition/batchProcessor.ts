
import { supabase } from '@/integrations/supabase/client';
import type { VehiclePositionUpdate, BatchProcessingResult } from './types';

export class BatchProcessor {
  private readonly BATCH_SIZE = 100;

  createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  async processBatch(positions: any[]): Promise<BatchProcessingResult> {
    let updatedCount = 0;
    let errors = 0;

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

    // Cast updates to any[] to bypass TS2589 deep inference error
    const updateChunks = this.createBatches(updates as any[], this.BATCH_SIZE);
    
    for (const chunk of updateChunks) {
      try {
        for (const update of chunk) {
          // Simplified update to avoid TS2589 - using minimal object structure
          const updateData = {
            last_position: update.last_position,
            updated_at: update.updated_at
          };

          // THE ULTIMATE FIX: Cast the entire Supabase query chain to 'any'
          // This completely bypasses TypeScript's type inference for the update method
          const { error: updateError } = await (supabase
            .from('vehicles') as any)
            .update(updateData)
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

    return { updatedCount, errors, batchSize: positions.length };
  }

  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
