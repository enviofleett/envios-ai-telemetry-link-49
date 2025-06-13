import { supabase } from '@/integrations/supabase/client';
import { gp51DataService, type GP51ProcessedPosition, type LiveVehicleFilterConfig } from '@/services/gp51/GP51DataService';
import { ErrorHandlingService } from '@/services/errorHandlingService';
import type { 
  VehicleData, 
  VehicleDataMetrics, 
  VehiclePosition
} from '@/types/vehicle';

interface SupabaseVehicleRow {
  id: string;
  device_id: string;
  device_name: string;
  is_active: boolean;
  envio_user_id?: string;
  created_at: string;
  updated_at: string;
}

class EnhancedVehicleDataService {
  private vehicles: VehicleData[] = [];
  private lastSyncTime: Date = new Date();
  private syncInProgress: boolean = false;
  private subscribers: (() => void)[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  // Default live vehicle configuration
  private defaultLiveConfig: LiveVehicleFilterConfig = {
    updateTimeThresholdMinutes: 30,
    includeIdleVehicles: true,
    requireGpsSignal: false
  };

  constructor() {
    this.startPeriodicSync();
  }

  private startPeriodicSync(): void {
    // Sync every 30 seconds
    this.syncInterval = setInterval(() => {
      if (!this.syncInProgress) {
        this.syncVehicleData();
      }
    }, 30000);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private transformToVehicleData(
    supabaseVehicle: SupabaseVehicleRow,
    gp51ProcessedPosition?: GP51ProcessedPosition
  ): VehicleData {
    // Convert GP51ProcessedPosition to authoritative VehiclePosition if available
    const last_position: VehiclePosition | undefined = gp51ProcessedPosition ? {
      lat: gp51ProcessedPosition.latitude,
      lng: gp51ProcessedPosition.longitude,
      speed: gp51ProcessedPosition.speed,
      course: gp51ProcessedPosition.course,
      timestamp: gp51ProcessedPosition.timestamp.toISOString(),
      statusText: gp51ProcessedPosition.statusText
    } : undefined;

    const lastUpdate = last_position 
      ? new Date(last_position.timestamp)
      : new Date(supabaseVehicle.updated_at);

    const isOnline = last_position ? 
      (Date.now() - new Date(last_position.timestamp).getTime()) < (5 * 60 * 1000) : false;

    const isMoving = last_position ? (last_position.speed > 2) : false;

    let status: 'online' | 'offline' | 'idle' | 'moving' = 'offline';
    if (isOnline) {
      status = isMoving ? 'moving' : 'idle';
    }

    return {
      id: supabaseVehicle.id,
      device_id: supabaseVehicle.device_id,
      device_name: supabaseVehicle.device_name,
      status,
      lastUpdate,
      last_position,
      isOnline,
      isMoving,
      alerts: [], // Will be populated from alerts table if needed
      is_active: supabaseVehicle.is_active,
      envio_user_id: supabaseVehicle.envio_user_id,
      // Legacy compatibility properties
      deviceId: supabaseVehicle.device_id,
      deviceName: supabaseVehicle.device_name,
      lastPosition: last_position
    };
  }

  async syncVehicleData(useLiveFilter: boolean = false, liveConfig?: LiveVehicleFilterConfig): Promise<void> {
    if (this.syncInProgress) {
      console.log('🔄 Sync already in progress, skipping...');
      return;
    }

    this.syncInProgress = true;

    try {
      await ErrorHandlingService.withRetry(
        async () => {
          console.log('🚗 Starting enhanced vehicle data sync...', { useLiveFilter, liveConfig });

          // Step 1: Fetch vehicles from Supabase (using correct schema)
          const { data: supabaseVehicles, error: supabaseError } = await supabase
            .from('vehicles')
            .select(`
              id,
              device_id,
              device_name,
              is_active,
              envio_user_id,
              created_at,
              updated_at
            `)
            .order('created_at', { ascending: false });

          if (supabaseError) {
            throw new Error(`Supabase fetch failed: ${supabaseError.message}`);
          }

          if (!supabaseVehicles || supabaseVehicles.length === 0) {
            console.log('📝 No vehicles found in Supabase');
            this.vehicles = [];
            this.lastSyncTime = new Date();
            this.notifySubscribers();
            return;
          }

          console.log(`📋 Found ${supabaseVehicles.length} vehicles in Supabase`);

          // Step 2: Get live positions from GP51
          let gp51Positions: Map<string, GP51ProcessedPosition>;

          if (useLiveFilter && liveConfig) {
            // Use live vehicle filtering
            const liveVehicles = await gp51DataService.getLiveVehicles(liveConfig);
            gp51Positions = new Map(liveVehicles.map(v => [v.deviceId, v]));
            console.log(`📍 Received ${gp51Positions.size} live vehicle positions from GP51`);
          } else {
            // Use standard position fetching
            const deviceIds = supabaseVehicles.map(v => v.device_id);
            gp51Positions = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);
            console.log(`📍 Received ${gp51Positions.size} positions from GP51`);
          }

          // Step 3: Transform and merge data
          const enhancedVehicles: VehicleData[] = supabaseVehicles.map(supabaseVehicle => {
            const gp51ProcessedPosition = gp51Positions.get(supabaseVehicle.device_id);
            return this.transformToVehicleData(supabaseVehicle, gp51ProcessedPosition);
          });

          this.vehicles = enhancedVehicles;
          this.lastSyncTime = new Date();

          console.log(`✅ Enhanced vehicle data sync completed: ${this.vehicles.length} vehicles processed`);
          
          this.notifySubscribers();
        },
        {
          service: 'enhancedVehicleDataService',
          operation: 'syncVehicleData',
          timestamp: new Date(),
          userFacing: false
        }
      );

    } catch (error) {
      console.error('❌ Enhanced vehicle data sync failed:', error);
      // Don't throw - let the app continue with stale data
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncLiveVehiclesOnly(liveConfig?: LiveVehicleFilterConfig): Promise<void> {
    const config = liveConfig || this.defaultLiveConfig;
    await this.syncVehicleData(true, config);
  }

  async forceSync(): Promise<void> {
    this.syncInProgress = false; // Reset flag to allow force sync
    await this.syncVehicleData();
  }

  async forceSyncLiveOnly(liveConfig?: LiveVehicleFilterConfig): Promise<void> {
    this.syncInProgress = false; // Reset flag to allow force sync
    await this.syncLiveVehiclesOnly(liveConfig);
  }

  getVehicles(): VehicleData[] {
    return [...this.vehicles];
  }

  async getVehiclesPaginated(options: { page: number; limit: number }): Promise<{ 
    data: VehicleData[]; 
    error: string | null; 
    hasMore: boolean 
  }> {
    try {
      // Ensure we have fresh data
      if (this.vehicles.length === 0) {
        await this.syncVehicleData();
      }

      const startIndex = options.page * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedVehicles = this.vehicles.slice(startIndex, endIndex);
      const hasMore = endIndex < this.vehicles.length;

      return {
        data: paginatedVehicles,
        error: null,
        hasMore
      };
    } catch (error) {
      console.error('Error getting paginated vehicles:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Failed to get vehicles',
        hasMore: false
      };
    }
  }

  getVehicleById(deviceId: string): VehicleData | undefined {
    return this.vehicles.find(v => v.device_id === deviceId);
  }

  getMetrics(): VehicleDataMetrics {
    const total = this.vehicles.length;
    const online = this.vehicles.filter(v => v.isOnline).length;
    const offline = total - online;
    const alerts = this.vehicles.reduce((sum, v) => sum + v.alerts.length, 0);
    const onlineVehicles = online;
    const offlineVehicles = offline;
    const totalVehicles = total;
    const recentlyActiveVehicles = this.vehicles.filter(v => {
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      return v.lastUpdate.getTime() > thirtyMinutesAgo;
    }).length;

    return {
      // Dashboard-compatible properties
      total,
      online,
      offline,
      alerts,
      // Legacy properties
      totalVehicles,
      onlineVehicles,
      offlineVehicles,
      recentlyActiveVehicles,
      // Sync properties
      lastSyncTime: this.lastSyncTime,
      positionsUpdated: this.vehicles.length,
      errors: 0,
      syncStatus: 'success' as const
    };
  }

  // Helper methods for filtering
  getLiveVehicles(): VehicleData[] {
    return this.vehicles.filter(v => {
      if (!v.last_position?.timestamp) return false;
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      return new Date(v.last_position.timestamp).getTime() > fiveMinutesAgo;
    });
  }

  getOfflineVehicles(): VehicleData[] {
    return this.vehicles.filter(v => !v.isOnline);
  }

  getMovingVehicles(): VehicleData[] {
    return this.vehicles.filter(v => v.isMoving);
  }

  getIdleVehicles(): VehicleData[] {
    return this.vehicles.filter(v => v.isOnline && !v.isMoving);
  }

  getVehiclesWithAlerts(): VehicleData[] {
    return this.vehicles.filter(v => v.alerts.length > 0);
  }

  getRecentlyActiveVehicles(timeframeMinutes: number = 30): VehicleData[] {
    const cutoffTime = Date.now() - (timeframeMinutes * 60 * 1000);
    return this.vehicles.filter(v => {
      return v.last_position && new Date(v.last_position.timestamp).getTime() > cutoffTime;
    });
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.subscribers.length = 0;
  }
}

// Export singleton instance
export const enhancedVehicleDataService = new EnhancedVehicleDataService();

// Export helper functions for compatibility
export const getEnhancedVehicles = async (options: { page: number; limit: number }) => {
  return enhancedVehicleDataService.getVehiclesPaginated(options);
};

export const getVehicleDataMetrics = (vehicles: VehicleData[]): VehicleDataMetrics => {
  const total = vehicles.length;
  const online = vehicles.filter(v => v.isOnline).length;
  const offline = total - online;
  const alerts = vehicles.reduce((sum, v) => sum + v.alerts.length, 0);

  return {
    total,
    online,
    offline,
    alerts,
    totalVehicles: total,
    onlineVehicles: online,
    offlineVehicles: offline,
    recentlyActiveVehicles: vehicles.filter(v => {
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      return v.lastUpdate.getTime() > thirtyMinutesAgo;
    }).length,
    lastSyncTime: new Date(),
    positionsUpdated: vehicles.length,
    errors: 0,
    syncStatus: 'success' as const
  };
};
