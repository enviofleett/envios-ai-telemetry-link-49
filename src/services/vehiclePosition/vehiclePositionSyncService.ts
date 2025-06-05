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
    console.log('Initializing enhanced vehicle position sync service...');
    
    // Check if we have an active GP51 session with consistent username
    const sessionValidation = await gp51SessionValidator.validateGP51Session();
    if (!sessionValidation.valid) {
      console.warn('GP51 session validation failed:', sessionValidation.error);
    }

    // Start periodic sync with intelligent intervals
    this.startPeriodicSync();
  }

  public startPeriodicSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`Starting enhanced vehicle position sync with ${intervalMs}ms interval`);
    
    // Perform initial sync
    this.syncVehiclePositions();

    // Set up intelligent periodic sync
    this.syncInterval = setInterval(() => {
      this.syncVehiclePositionsIntelligent();
    }, intervalMs);
  }

  private async syncVehiclePositionsIntelligent(): Promise<void> {
    // Skip if already syncing
    if (this.isSyncing) {
      console.log('Intelligent sync: already in progress, skipping...');
      return;
    }

    // Determine sync strategy based on time and previous results
    const now = new Date();
    const timeSinceLastSync = now.getTime() - this.metrics.lastSyncTime.getTime();
    const shouldFullSync = timeSinceLastSync > 300000; // Full sync every 5 minutes

    if (shouldFullSync) {
      console.log('Performing full intelligent sync...');
      await this.syncVehiclePositions();
    } else {
      console.log('Performing partial intelligent sync...');
      await this.syncRecentlyActiveVehicles();
    }
  }

  private async syncRecentlyActiveVehicles(): Promise<void> {
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      // Get recently active vehicles (last 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      
      const { data: recentVehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('device_id, device_name, is_active, gp51_username, updated_at')
        .eq('is_active', true)
        .gte('updated_at', twoHoursAgo.toISOString())
        .limit(500); // Focus on most recently active

      if (vehiclesError) {
        throw new Error(`Failed to fetch recent vehicles: ${vehiclesError.message}`);
      }

      if (!recentVehicles || recentVehicles.length === 0) {
        console.log('No recently active vehicles found for partial sync');
        return;
      }

      console.log(`Performing partial sync for ${recentVehicles.length} recently active vehicles`);

      const { updatedCount, errors } = await vehiclePositionProcessor.fetchAndUpdateVehiclePositions(recentVehicles);

      // Update metrics (partial update)
      this.metrics.positionsUpdated += updatedCount;
      this.metrics.errors += errors;
      this.metrics.lastSyncTime = new Date();

      console.log(`Partial sync completed: ${updatedCount} vehicles updated, ${errors} errors`);

    } catch (error) {
      console.error('Partial vehicle sync failed:', error);
      this.metrics.errors++;
    } finally {
      this.isSyncing = false;
    }
  }

  public async syncVehiclePositions(): Promise<SyncMetrics> {
    if (this.isSyncing) {
      console.log('Full position sync already in progress, skipping...');
      return this.metrics;
    }

    this.isSyncing = true;
    console.log('Starting comprehensive vehicle position sync...');

    try {
      // Validate session before attempting sync
      const sessionValidation = await gp51SessionValidator.validateGP51Session();
      if (!sessionValidation.valid) {
        throw new Error(`GP51 session invalid: ${sessionValidation.error}`);
      }

      // Get ALL active vehicles from the database
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

      console.log(`Found ${vehicles.length} active vehicles for comprehensive position sync`);
      this.metrics.totalVehicles = vehicles.length;

      // Process vehicle positions with enhanced batch handling
      const { updatedCount, errors, totalProcessed, totalRequested } = await vehiclePositionProcessor.fetchAndUpdateVehiclePositions(vehicles);

      this.metrics.positionsUpdated = updatedCount;
      this.metrics.errors = errors;
      this.metrics.lastSyncTime = new Date();

      console.log(`Comprehensive sync completed: ${updatedCount} vehicles updated, ${errors} errors, ${totalProcessed} processed of ${totalRequested} total vehicles`);

      // Update sync status in database
      await syncStatusUpdater.updateSyncStatus(true);

      return this.metrics;

    } catch (error) {
      console.error('Comprehensive vehicle position sync failed:', error);
      this.metrics.errors++;
      await syncStatusUpdater.updateSyncStatus(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  public stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Enhanced vehicle position sync stopped');
    }
  }

  public getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  public async forceSync(): Promise<SyncMetrics> {
    console.log('Force syncing all vehicle positions...');
    return await this.syncVehiclePositions();
  }
}

export const vehiclePositionSyncService = new VehiclePositionSyncService();
