import { supabase } from '@/integrations/supabase/client';
import { gp51SessionValidator } from './sessionValidator';
import { vehiclePositionProcessor } from './positionProcessor';
import { syncStatusUpdater } from './statusUpdater';
import type { SyncMetrics } from './types';

export class VehiclePositionSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private liveModeInterval: NodeJS.Timeout | null = null;
  private progressiveInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isProgressiveSyncing = false;
  private isLiveModeEnabled = false;
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
    console.log('Initializing enhanced vehicle position sync service with 30-second intervals...');
    
    const sessionValidation = await gp51SessionValidator.ensureValidSession();
    if (!sessionValidation.valid) {
      console.warn('GP51 session validation failed during initialization:', sessionValidation.error);
    } else {
      console.log('✅ GP51 session validated successfully during initialization');
    }

    this.startPeriodicSync();
    this.startProgressiveSync();
  }

  public startPeriodicSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`Starting enhanced vehicle position sync with ${intervalMs}ms interval (30 seconds)`);
    
    this.syncActiveVehiclePositions();

    this.syncInterval = setInterval(() => {
      this.syncActiveVehiclePositions();
    }, intervalMs);
  }

  public enableLiveMode(enabled: boolean = true): void {
    this.isLiveModeEnabled = enabled;
    
    if (enabled) {
      if (this.liveModeInterval) {
        clearInterval(this.liveModeInterval);
      }
      
      console.log('🔴 LIVE MODE ENABLED: 15-second position updates for active vehicles');
      
      this.liveModeInterval = setInterval(() => {
        this.syncActiveVehiclePositionsOnly();
      }, 15000); // 15 seconds for live mode
    } else {
      if (this.liveModeInterval) {
        clearInterval(this.liveModeInterval);
        this.liveModeInterval = null;
      }
      console.log('⚪ Live mode disabled');
    }
  }

  private startProgressiveSync(): void {
    if (this.progressiveInterval) {
      clearInterval(this.progressiveInterval);
    }

    console.log('Starting progressive sync for stale vehicles (60s interval)');
    
    this.progressiveInterval = setInterval(() => {
      this.syncVehiclesNeedingUpdates();
    }, 60000);
  }

  private async syncActiveVehiclePositionsOnly(): Promise<void> {
    if (this.isSyncing) {
      console.log('Live mode sync: sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    
    try {
      console.log('🔴 Live mode: Syncing active vehicle positions only...');

      const sessionValidation = await gp51SessionValidator.ensureValidSession();
      if (!sessionValidation.valid) {
        console.error('Live mode sync aborted: no valid GP51 session');
        return;
      }

      // Get only active vehicles (updated within last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: activeVehicles, error } = await supabase
        .from('vehicles')
        .select('device_id, device_name, is_active, gp51_username, last_position')
        .eq('is_active', true)
        .gte('last_position->>updatetime', thirtyMinutesAgo)
        .limit(500); // Focus on most active vehicles

      if (error) throw error;

      if (!activeVehicles || activeVehicles.length === 0) {
        console.log('🔴 Live mode: No active vehicles found for position updates');
        return;
      }

      console.log(`🔴 Live mode: Updating ${activeVehicles.length} active vehicles`);

      const result = await vehiclePositionProcessor.fetchAndUpdateVehiclePositions(activeVehicles);
      
      console.log(`🔴 Live mode completed: ${result.updatedCount} vehicles updated, ${result.errors} errors`);

    } catch (error) {
      console.error('Live mode vehicle sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncActiveVehiclePositions(): Promise<void> {
    if (this.isSyncing) {
      console.log('Active sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    console.log('Starting active vehicle position sync (30-second interval)...');

    try {
      const sessionValidation = await gp51SessionValidator.ensureValidSession();
      if (!sessionValidation.valid) {
        throw new Error(`GP51 session validation failed: ${sessionValidation.error}`);
      }

      console.log(`✅ Using valid GP51 session for ${sessionValidation.username}`);

      // Get vehicles that have been active in the last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('device_id, device_name, is_active, gp51_username, last_position')
        .eq('is_active', true)
        .or(`last_position->updatetime.gte.${twoHoursAgo},last_position->updatetime.is.null`)
        .order('last_position->>updatetime', { ascending: false })
        .limit(1000);

      if (vehiclesError) {
        throw new Error(`Failed to fetch active vehicles: ${vehiclesError.message}`);
      }

      if (!vehicles || vehicles.length === 0) {
        console.log('No active vehicles found for position sync');
        this.metrics.totalVehicles = 0;
        return;
      }

      console.log(`Found ${vehicles.length} active vehicles for position sync`);
      this.metrics.totalVehicles = vehicles.length;

      const result = await vehiclePositionProcessor.fetchAndUpdateVehiclePositions(vehicles);

      this.metrics.positionsUpdated = result.updatedCount;
      this.metrics.errors = result.errors;
      this.metrics.lastSyncTime = new Date();

      console.log(`Active vehicle sync completed: ${result.updatedCount} vehicles updated, ${result.errors} errors`);
      console.log(`Completion rate: ${result.completionRate.toFixed(2)}%`);

      await syncStatusUpdater.updateSyncStatus(true, undefined);

    } catch (error) {
      console.error('Active vehicle position sync failed:', error);
      this.metrics.errors++;
      await syncStatusUpdater.updateSyncStatus(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncVehiclesNeedingUpdates(): Promise<void> {
    if (this.isProgressiveSyncing || this.isSyncing) {
      console.log('Progressive sync: sync already in progress, skipping...');
      return;
    }

    this.isProgressiveSyncing = true;
    
    try {
      console.log('Starting progressive sync for stale vehicles...');

      const sessionValidation = await gp51SessionValidator.ensureValidSession();
      if (!sessionValidation.valid) {
        console.error('Progressive sync aborted: no valid GP51 session');
        return;
      }

      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      
      const { data: staleVehicles, error } = await supabase
        .from('vehicles')
        .select('device_id, device_name, is_active, gp51_username, last_position')
        .eq('is_active', true)
        .or(`last_position->updatetime.is.null,last_position->>updatetime.lt.${sixHoursAgo}`)
        .limit(200);

      if (error) throw error;

      if (!staleVehicles || staleVehicles.length === 0) {
        console.log('No stale vehicles need progressive position updates');
        return;
      }

      console.log(`Progressive sync: updating ${staleVehicles.length} stale vehicles`);

      const result = await vehiclePositionProcessor.fetchAndUpdateVehiclePositions(staleVehicles);
      
      console.log(`Progressive sync completed: ${result.updatedCount} vehicles updated, ${result.errors} errors`);

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
    console.log('Starting comprehensive vehicle position sync for ALL vehicles...');

    try {
      const sessionValidation = await gp51SessionValidator.ensureValidSession();
      if (!sessionValidation.valid) {
        throw new Error(`GP51 session validation failed: ${sessionValidation.error}`);
      }

      console.log(`✅ Using valid GP51 session for ${sessionValidation.username}`);

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

      const result = await vehiclePositionProcessor.fetchAndUpdateVehiclePositions(vehicles);

      this.metrics.positionsUpdated = result.updatedCount;
      this.metrics.errors = result.errors;
      this.metrics.lastSyncTime = new Date();

      console.log(`Comprehensive sync completed: ${result.updatedCount} vehicles updated, ${result.errors} errors`);

      await syncStatusUpdater.updateSyncStatus(true, undefined);

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
    if (this.liveModeInterval) {
      clearInterval(this.liveModeInterval);
      this.liveModeInterval = null;
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
    console.log('Force syncing active vehicle positions...');
    await this.syncActiveVehiclePositions();
    return this.metrics;
  }

  public async getSyncProgress(): Promise<{
    totalVehicles: number;
    vehiclesWithRecentUpdates: number;
    vehiclesNeedingUpdates: number;
    completionPercentage: number;
  }> {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const [totalResult, recentResult] = await Promise.all([
        supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true),
        supabase
          .from('vehicles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('last_position->>updatetime', thirtyMinutesAgo)
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

  public isLiveModeActive(): boolean {
    return this.isLiveModeEnabled;
  }
}

export const vehiclePositionSyncService = new VehiclePositionSyncService();
