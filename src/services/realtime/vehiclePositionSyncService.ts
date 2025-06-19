
import { supabase } from '@/integrations/supabase/client';
import { gp51DataService } from '@/services/gp51/GP51DataService';

interface SyncMetrics {
  totalVehicles: number;
  processedVehicles: number;
  successfulUpdates: number;
  failedUpdates: number;
  errors: string[];
  syncStartTime: Date;
  syncEndTime?: Date;
  lastSyncTime: Date;
}

interface SyncConfiguration {
  id: string;
  sync_type: string;
  is_enabled: boolean;
  sync_interval_minutes: number;
  last_sync_at?: string;
  retry_count: number;
  max_retries: number;
  backoff_multiplier: number;
  sync_settings: any;
}

export class VehiclePositionSyncService {
  private static instance: VehiclePositionSyncService;
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private metrics: SyncMetrics = {
    totalVehicles: 0,
    processedVehicles: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    errors: [],
    syncStartTime: new Date(),
    lastSyncTime: new Date()
  };
  private statusCallbacks: ((status: string) => void)[] = [];
  private currentSyncId: string | null = null;

  static getInstance(): VehiclePositionSyncService {
    if (!VehiclePositionSyncService.instance) {
      VehiclePositionSyncService.instance = new VehiclePositionSyncService();
    }
    return VehiclePositionSyncService.instance;
  }

  async startPeriodicSync(): Promise<void> {
    if (this.isRunning) {
      console.log('📡 Sync service already running');
      return;
    }

    console.log('🚀 Starting periodic vehicle position sync service...');
    this.isRunning = true;
    
    // Get sync configuration
    const config = await this.getSyncConfiguration();
    if (!config || !config.is_enabled) {
      console.log('⏸️ Sync service disabled in configuration');
      return;
    }

    // Initial sync
    await this.performSync();

    // Schedule periodic syncing
    const intervalMs = config.sync_interval_minutes * 60 * 1000;
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, intervalMs);

    this.notifyStatusCallbacks('running');
    console.log(`✅ Sync service started with ${config.sync_interval_minutes}min intervals`);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    this.notifyStatusCallbacks('stopped');
    console.log('🛑 Periodic sync service stopped');
  }

  async forceSync(): Promise<SyncMetrics> {
    console.log('🔄 Force sync requested...');
    return await this.performSync();
  }

  private async getSyncConfiguration(): Promise<SyncConfiguration | null> {
    try {
      const { data, error } = await supabase
        .from('sync_configuration')
        .select('*')
        .eq('sync_type', 'vehicle_positions')
        .eq('is_enabled', true)
        .single();

      if (error) {
        console.error('Failed to get sync configuration:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching sync configuration:', error);
      return null;
    }
  }

  private async performSync(): Promise<SyncMetrics> {
    if (this.currentSyncId) {
      console.log('⏳ Sync already in progress, skipping...');
      return this.metrics;
    }

    this.currentSyncId = crypto.randomUUID();
    const syncStartTime = new Date();

    // Create sync status record
    const { data: syncStatus } = await supabase
      .from('sync_status')
      .insert({
        sync_type: 'vehicle_positions',
        status: 'running',
        started_at: syncStartTime.toISOString()
      })
      .select()
      .single();

    this.metrics = {
      totalVehicles: 0,
      processedVehicles: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      errors: [],
      syncStartTime,
      lastSyncTime: syncStartTime
    };

    this.notifyStatusCallbacks('syncing');

    try {
      // Fetch all vehicles from database
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name');

      if (vehiclesError) {
        throw new Error(`Failed to fetch vehicles: ${vehiclesError.message}`);
      }

      this.metrics.totalVehicles = vehicles?.length || 0;
      console.log(`📊 Starting sync for ${this.metrics.totalVehicles} vehicles`);

      if (vehicles && vehicles.length > 0) {
        // Get device IDs for GP51 API call
        const deviceIds = vehicles.map(v => v.gp51_device_id);
        
        // Fetch latest positions from GP51
        const positionsMap = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);
        console.log(`📍 Retrieved ${positionsMap.size} positions from GP51`);

        // Process each vehicle
        for (const vehicle of vehicles) {
          try {
            await this.processVehiclePosition(vehicle, positionsMap.get(vehicle.gp51_device_id));
            this.metrics.processedVehicles++;
            this.metrics.successfulUpdates++;
          } catch (error) {
            console.error(`❌ Failed to process vehicle ${vehicle.gp51_device_id}:`, error);
            this.metrics.failedUpdates++;
            this.metrics.errors.push(`${vehicle.gp51_device_id}: ${error}`);
          }

          // Update sync status progress
          if (syncStatus) {
            await supabase
              .from('sync_status')
              .update({
                processed_records: this.metrics.processedVehicles,
                successful_records: this.metrics.successfulUpdates,
                failed_records: this.metrics.failedUpdates
              })
              .eq('id', syncStatus.id);
          }
        }
      }

      this.metrics.syncEndTime = new Date();
      const duration = this.metrics.syncEndTime.getTime() - syncStartTime.getTime();

      // Update sync status as completed
      if (syncStatus) {
        await supabase
          .from('sync_status')
          .update({
            status: 'completed',
            completed_at: this.metrics.syncEndTime.toISOString(),
            total_records: this.metrics.totalVehicles,
            processed_records: this.metrics.processedVehicles,
            successful_records: this.metrics.successfulUpdates,
            failed_records: this.metrics.failedUpdates,
            error_count: this.metrics.errors.length,
            last_error: this.metrics.errors.length > 0 ? this.metrics.errors[this.metrics.errors.length - 1] : null,
            performance_metrics: {
              duration_ms: duration,
              vehicles_per_second: this.metrics.totalVehicles > 0 ? (this.metrics.totalVehicles / (duration / 1000)) : 0
            }
          })
          .eq('id', syncStatus.id);
      }

      // Update sync configuration
      await supabase
        .from('sync_configuration')
        .update({
          last_sync_at: this.metrics.syncEndTime.toISOString(),
          retry_count: 0
        })
        .eq('sync_type', 'vehicle_positions');

      console.log(`✅ Sync completed: ${this.metrics.successfulUpdates}/${this.metrics.totalVehicles} vehicles updated in ${duration}ms`);
      this.notifyStatusCallbacks('completed');

    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.metrics.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      
      // Update sync status as failed
      if (syncStatus) {
        await supabase
          .from('sync_status')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_count: this.metrics.errors.length,
            last_error: error instanceof Error ? error.message : 'Unknown sync error'
          })
          .eq('id', syncStatus.id);
      }

      this.notifyStatusCallbacks('error');
    } finally {
      this.currentSyncId = null;
    }

    return this.metrics;
  }

  private async processVehiclePosition(vehicle: any, position: any): Promise<void> {
    if (!position) {
      // No position data available
      return;
    }

    const now = new Date().toISOString();

    // Update vehicle record
    await supabase
      .from('vehicles')
      .update({
        updated_at: now
      })
      .eq('id', vehicle.id);

    // Insert position history
    await supabase
      .from('vehicle_position_history')
      .insert({
        vehicle_id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed || 0,
        heading: position.course || 0,
        recorded_at: position.timestamp || now,
        sync_source: 'gp51',
        raw_data: position
      });
  }

  subscribeToStatus(callback: (status: string) => void): () => void {
    this.statusCallbacks.push(callback);
    return () => {
      this.statusCallbacks = this.statusCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyStatusCallbacks(status: string): void {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  getSyncProgress() {
    return {
      totalVehicles: this.metrics.totalVehicles,
      processedVehicles: this.metrics.processedVehicles,
      percentage: this.metrics.totalVehicles > 0 
        ? Math.round((this.metrics.processedVehicles / this.metrics.totalVehicles) * 100) 
        : 0,
      currentVehicle: null,
      errors: this.metrics.errors
    };
  }

  getMetrics() {
    return {
      syncCount: this.metrics.processedVehicles,
      errorCount: this.metrics.errors.length,
      averageLatency: 0,
      lastSyncTime: this.metrics.lastSyncTime
    };
  }

  destroy() {
    this.stopPeriodicSync();
    this.statusCallbacks = [];
    console.log('🧹 Vehicle position sync service destroyed');
  }
}

export const vehiclePositionSyncService = VehiclePositionSyncService.getInstance();
