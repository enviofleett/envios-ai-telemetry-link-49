import { supabase } from '@/integrations/supabase/client';
import { gp51SessionValidator } from './sessionValidator';
import { vehiclePositionProcessor } from './positionProcessor';
import { syncStatusUpdater } from './statusUpdater';
import type { SyncMetrics } from './types';

export class VehiclePositionSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private progressiveInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isProgressiveSyncing = false;
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
    console.log('Initializing enhanced vehicle position sync service for ALL vehicles...');
    
    // Check if we have an active GP51 session using improved validation
    const sessionValidation = await gp51SessionValidator.ensureValidSession();
    if (!sessionValidation.valid) {
      console.warn('GP51 session validation failed during initialization:', sessionValidation.error);
    } else {
      console.log('✅ GP51 session validated successfully during initialization');
    }

    // Start both periodic and progressive sync
    this.startPeriodicSync();
    this.startProgressiveSync();
  }

  public startPeriodicSync(intervalMs: number = 300000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`Starting enhanced vehicle position sync with ${intervalMs}ms interval for ALL vehicles`);
    
    // Perform initial sync
    this.syncAllVehiclePositions();

    this.syncInterval = setInterval(() => {
      this.syncAllVehiclePositions();
    }, intervalMs);
  }

  private startProgressiveSync(): void {
    if (this.progressiveInterval) {
      clearInterval(this.progressiveInterval);
    }

    console.log('Starting progressive sync for vehicles needing position updates');
    
    this.progressiveInterval = setInterval(() => {
      this.syncVehiclesNeedingUpdates();
    }, 60000); // Every minute
  }

  private async syncVehiclesNeedingUpdates(): Promise<void> {
    if (this.isProgressiveSyncing || this.isSyncing) {
      console.log('Progressive sync: sync already in progress, skipping...');
      return;
    }

    this.isProgressiveSyncing = true;
    
    try {
      console.log('Starting progressive sync for vehicles without recent positions...');

      // Ensure we have a valid session before starting
      const sessionValidation = await gp51SessionValidator.ensureValidSession();
      if (!sessionValidation.valid) {
        console.error('Progressive sync aborted: no valid GP51 session');
        return;
      }

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: staleVehicles, error } = await supabase
        .from('vehicles')
        .select('device_id, device_name, is_active, gp51_username, last_position')
        .eq('is_active', true)
        .or(`last_position->updatetime.is.null,last_position->>updatetime.lt.${twentyFourHoursAgo}`)
        .limit(1000);

      if (error) throw error;

      if (!staleVehicles || staleVehicles.length === 0) {
        console.log('No vehicles need progressive position updates');
        return;
      }

      console.log(`Progressive sync: updating ${staleVehicles.length} vehicles without recent positions`);

      const result = await vehiclePositionProcessor.fetchAndUpdateVehiclePositions(staleVehicles);
      
      console.log(`Progressive sync completed: ${result.updatedCount} vehicles updated, ${result.errors} errors`);
      console.log(`Progressive sync completion rate: ${result.completionRate.toFixed(2)}%`);

    } catch (error) {
      console.error('Progressive vehicle sync failed:', error);
    } finally {
      this.isProgressiveSyncing = false;
    }
  }

  public async syncAllVehiclePositions(): Promise<SyncMetrics> {
    if (this.isSyncing) {
      console.log('Full sync already in progress, skipping...');
      return this.metrics;
    }

    this.isSyncing = true;
    console.log('Starting comprehensive vehicle position sync for ALL 3821+ vehicles...');

    try {
      // Ensure valid session before attempting sync with improved validation
      const sessionValidation = await gp51SessionValidator.ensureValidSession();
      if (!sessionValidation.valid) {
        throw new Error(`GP51 session validation failed: ${sessionValidation.error}`);
      }

      console.log(`✅ Using valid GP51 session for ${sessionValidation.username}`);

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

      // Process ALL vehicle positions with enhanced batch handling
      const result = await vehiclePositionProcessor.fetchAndUpdateVehiclePositions(vehicles);

      this.metrics.positionsUpdated = result.updatedCount;
      this.metrics.errors = result.errors;
      this.metrics.lastSyncTime = new Date();

      console.log(`Comprehensive sync completed: ${result.updatedCount} vehicles updated, ${result.errors} errors, ${result.totalProcessed} processed of ${result.totalRequested} total vehicles`);
      console.log(`Overall completion rate: ${result.completionRate.toFixed(2)}%, Average processing time: ${result.avgProcessingTime.toFixed(2)}ms per vehicle`);

      // Update sync status in database with detailed metrics
      await syncStatusUpdater.updateSyncStatus(true, undefined);

      // Alert if completion rate is below target
      if (result.completionRate < 95) {
        console.warn(`⚠️  Low completion rate: ${result.completionRate.toFixed(2)}% (target: 95%+)`);
      }

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
    }
    if (this.progressiveInterval) {
      clearInterval(this.progressiveInterval);
      this.progressiveInterval = null;
    }
    console.log('Enhanced vehicle position sync stopped');
  }

  public getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  public async forceSync(): Promise<SyncMetrics> {
    console.log('Force syncing ALL vehicle positions...');
    return await this.syncAllVehiclePositions();
  }

  public async getSyncProgress(): Promise<{
    totalVehicles: number;
    vehiclesWithRecentUpdates: number;
    vehiclesNeedingUpdates: number;
    completionPercentage: number;
  }> {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [totalResult, recentResult] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('last_position->>updatetime', twentyFourHoursAgo)
      ]);

      const totalVehicles = totalResult.count || 0;
      const vehiclesWithRecentUpdates = recentResult.count || 0;
      const vehiclesNeedingUpdates = totalVehicles - vehiclesWithRecentUpdates;
      const completionPercentage = totalVehicles > 0 ? (vehiclesWithRecentUpdates / totalVehicles) * 100 : 0;

      return {
        totalVehicles,
        vehiclesWithRecentUpdates,
        vehiclesNeedingUpdates,
        completionPercentage
      };

    } catch (error) {
      console.error('Failed to get sync progress:', error);
      return {
        totalVehicles: 0,
        vehiclesWithRecentUpdates: 0,
        vehiclesNeedingUpdates: 0,
        completionPercentage: 0
      };
    }
  }
}

export const vehiclePositionSyncService = new VehiclePositionSyncService();
