
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface VehicleServiceMetrics {
  total: number;
  online: number;
  offline: number;
  idle: number;
  alerts: number;
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  syncStatus: 'success' | 'error' | 'syncing';
  errorMessage?: string;
}

interface SyncMetrics {
  lastSyncTime: Date;
  positionsUpdated: number;
  errors: number;
  syncStatus: 'success' | 'error' | 'loading';
  errorMessage?: string;
}

class EnhancedVehicleDataService {
  private static instance: EnhancedVehicleDataService;
  private vehicles: VehicleData[] = [];
  private metrics: VehicleServiceMetrics = {
    total: 0,
    online: 0,
    offline: 0,
    idle: 0,
    alerts: 0,
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    recentlyActiveVehicles: 0,
    lastSyncTime: new Date(),
    syncStatus: 'success'
  };
  private lastSyncMetrics: SyncMetrics = {
    lastSyncTime: new Date(),
    positionsUpdated: 0,
    errors: 0,
    syncStatus: 'success'
  };
  private subscribers: Set<() => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private realtimeChannel: any = null;

  static getInstance(): EnhancedVehicleDataService {
    if (!EnhancedVehicleDataService.instance) {
      EnhancedVehicleDataService.instance = new EnhancedVehicleDataService();
    }
    return EnhancedVehicleDataService.instance;
  }

  private constructor() {
    this.initializeRealtimeSubscription();
    this.startPeriodicSync();
  }

  private initializeRealtimeSubscription() {
    // Clean up existing subscription first
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    try {
      this.realtimeChannel = supabase
        .channel('enhanced-vehicle-data')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vehicles'
          },
          () => {
            console.log('Vehicle data changed, refreshing...');
            this.syncVehicleData();
          }
        )
        .subscribe((status) => {
          console.log('Enhanced vehicle data subscription status:', status);
        });
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error);
    }
  }

  private async syncVehicleData() {
    try {
      this.updateMetrics({ syncStatus: 'syncing' });
      this.updateSyncMetrics({ syncStatus: 'loading' });
      
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error syncing vehicle data:', error);
        this.updateMetrics({ 
          syncStatus: 'error', 
          errorMessage: error.message 
        });
        this.updateSyncMetrics({ 
          syncStatus: 'error', 
          errorMessage: error.message 
        });
        return;
      }

      // Transform the data to match VehicleData interface with all required properties
      this.vehicles = (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id || '',
        device_name: vehicle.name || 'Unknown Device',
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        vin: vehicle.vin,
        license_plate: vehicle.license_plate,
        is_active: true, // Default value
        last_position: undefined,
        status: 'offline' as const,
        isOnline: false,
        isMoving: false,
        alerts: [], // Default empty array
        lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
      }));

      this.calculateMetrics();
      this.updateMetrics({ 
        syncStatus: 'success', 
        lastSyncTime: new Date(),
        errorMessage: undefined 
      });
      this.updateSyncMetrics({ 
        syncStatus: 'success', 
        lastSyncTime: new Date(),
        positionsUpdated: this.vehicles.length,
        errors: 0,
        errorMessage: undefined 
      });
      this.notifySubscribers();

    } catch (error) {
      console.error('Sync error:', error);
      this.updateMetrics({ 
        syncStatus: 'error', 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      });
      this.updateSyncMetrics({ 
        syncStatus: 'error', 
        errorMessage: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  private calculateMetrics() {
    const total = this.vehicles.length;
    const online = this.vehicles.filter(v => v.isOnline).length;
    const offline = total - online;
    const idle = this.vehicles.filter(v => v.isOnline && !v.isMoving).length;
    const alerts = this.vehicles.filter(v => v.alerts && v.alerts.length > 0).length;
    
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    const recentlyActive = this.vehicles.filter(v => 
      v.lastUpdate.getTime() > thirtyMinutesAgo
    ).length;

    this.updateMetrics({
      total,
      online,
      offline,
      idle,
      alerts,
      totalVehicles: total,
      onlineVehicles: online,
      offlineVehicles: offline,
      recentlyActiveVehicles: recentlyActive
    });
  }

  private updateMetrics(updates: Partial<VehicleServiceMetrics>) {
    this.metrics = { ...this.metrics, ...updates };
  }

  private updateSyncMetrics(updates: Partial<SyncMetrics>) {
    this.lastSyncMetrics = { ...this.lastSyncMetrics, ...updates };
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  private startPeriodicSync() {
    // Initial sync
    this.syncVehicleData();
    
    // Set up periodic sync every 30 seconds
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      this.syncVehicleData();
    }, 30000);
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getVehicles(): VehicleData[] {
    return [...this.vehicles];
  }

  getEnhancedVehicles(): VehicleData[] {
    return [...this.vehicles];
  }

  getMetrics(): VehicleServiceMetrics {
    return { ...this.metrics };
  }

  getLastSyncMetrics(): SyncMetrics {
    return { ...this.lastSyncMetrics };
  }

  getVehicleById(deviceId: string): VehicleData | undefined {
    return this.vehicles.find(v => v.device_id === deviceId);
  }

  async forceSync(): Promise<void> {
    await this.syncVehicleData();
  }

  destroy() {
    // Clean up interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    // Clean up realtime subscription
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }

    // Clear subscribers
    this.subscribers.clear();
  }
}

export const enhancedVehicleDataService = EnhancedVehicleDataService.getInstance();
