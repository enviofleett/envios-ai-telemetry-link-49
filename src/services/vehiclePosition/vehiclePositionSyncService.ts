
import { supabase } from '@/integrations/supabase/client';
import { gp51SessionValidator } from './sessionValidator';
import { vehiclePositionProcessor } from './positionProcessor';
import { syncStatusUpdater } from './statusUpdater';
import type { SyncMetrics } from './types';

export class VehiclePositionSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private metrics: SyncMetrics = {
    totalVehicles: 0,
    positionsUpdated: 0,
    errors: 0,
    lastSyncTime: new Date()
  };

  constructor() {
    this.initializeSync();
  }

  private async initializeSync(): Promise<void> {
    console.log('Initializing vehicle position sync service...');
    
    // Check if we have an active GP51 session with consistent username
    const sessionValidation = await gp51SessionValidator.validateGP51Session();
    if (!sessionValidation.valid) {
      console.warn('GP51 session validation failed:', sessionValidation.error);
    }

    // Start periodic sync
    this.startPeriodicSync();
  }

  public startPeriodicSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`Starting vehicle position sync with ${intervalMs}ms interval`);
    
    // Perform initial sync
    this.syncVehiclePositions();

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.syncVehiclePositions();
    }, intervalMs);
  }

  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Vehicle position sync stopped');
    }
  }

  public async syncVehiclePositions(): Promise<SyncMetrics> {
    if (this.isSyncing) {
      console.log('Position sync already in progress, skipping...');
      return this.metrics;
    }

    this.isSyncing = true;
    console.log('Starting vehicle position sync...');

    try {
      // Validate session before attempting sync
      const sessionValidation = await gp51SessionValidator.validateGP51Session();
      if (!sessionValidation.valid) {
        throw new Error(`GP51 session invalid: ${sessionValidation.error}`);
      }

      // Get ALL active vehicles from the database (removed limit)
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('device_id, device_name, is_active, gp51_username')
        .eq('is_active', true);

      if (vehiclesError) {
        throw new Error(`Failed to fetch vehicles: ${vehiclesError.message}`);
      }

      if (!vehicles || vehicles.length === 0) {
        console.log('No active vehicles found for position sync');
        this.metrics.totalVehicles = 0;
        return this.metrics;
      }

      console.log(`Found ${vehicles.length} active vehicles for position sync`);
      this.metrics.totalVehicles = vehicles.length;

      // Process vehicle positions with improved handling
      const { updatedCount, errors, totalProcessed, totalRequested } = await vehiclePositionProcessor.fetchAndUpdateVehiclePositions(vehicles);

      this.metrics.positionsUpdated = updatedCount;
      this.metrics.errors = errors;
      this.metrics.lastSyncTime = new Date();

      console.log(`Position sync completed: ${updatedCount} vehicles updated, ${errors} errors, ${totalProcessed} processed of ${totalRequested} total vehicles`);

      // Update sync status in database
      await syncStatusUpdater.updateSyncStatus(true);

      return this.metrics;

    } catch (error) {
      console.error('Vehicle position sync failed:', error);
      this.metrics.errors++;
      await syncStatusUpdater.updateSyncStatus(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  public getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  public async forceSync(): Promise<SyncMetrics> {
    console.log('Force syncing vehicle positions...');
    return await this.syncVehiclePositions();
  }
}

export const vehiclePositionSyncService = new VehiclePositionSyncService();
