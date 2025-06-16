
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehicleDataMetrics, SyncStatus } from '@/types/vehicle';

interface ServiceMetrics {
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
  syncStatus: SyncStatus;
  errorMessage?: string;
}

class EnhancedVehicleDataService {
  private vehicles: VehicleData[] = [];
  private metrics: ServiceMetrics = {
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
    syncStatus: 'loading' as SyncStatus,
  };
  private subscribers: (() => void)[] = [];

  async getEnhancedVehicles(): Promise<VehicleData[]> {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          sim_number,
          user_id,
          created_at,
          updated_at,
          envio_users (
            name,
            email
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        this.metrics.syncStatus = 'error' as SyncStatus;
        this.metrics.errorMessage = error.message;
        throw error;
      }

      if (!data) {
        return [];
      }

      const transformedVehicles: VehicleData[] = data.map((vehicle) => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        device_name: vehicle.name,
        sim_number: vehicle.sim_number,
        user_id: vehicle.user_id,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        envio_users: vehicle.envio_users,
        status: 'offline',
        is_active: true,
        last_position: undefined,
        lastUpdate: new Date(vehicle.updated_at),
        isOnline: false,
        isMoving: false,
        alerts: [],
        // Initialize additional properties
        speed: undefined,
        course: undefined,
        driver: null,
        fuel: undefined,
        mileage: undefined,
        plateNumber: undefined,
        model: undefined,
        gp51_metadata: {},
      }));

      this.vehicles = transformedVehicles;
      this.updateMetrics();
      this.metrics.syncStatus = 'success' as SyncStatus;
      this.notifySubscribers();

      return transformedVehicles;
    } catch (error) {
      this.metrics.syncStatus = 'error' as SyncStatus;
      this.metrics.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.notifySubscribers();
      throw error;
    }
  }

  async forceSync(): Promise<void> {
    this.metrics.syncStatus = 'syncing' as SyncStatus;
    this.notifySubscribers();
    await this.getEnhancedVehicles();
  }

  getLastSyncMetrics() {
    return {
      lastSyncTime: this.metrics.lastSyncTime,
      positionsUpdated: this.metrics.totalVehicles,
      errors: this.metrics.syncStatus === 'error' ? 1 : 0,
      syncStatus: this.metrics.syncStatus,
      errorMessage: this.metrics.errorMessage,
    };
  }

  private updateMetrics(): void {
    const total = this.vehicles.length;
    const online = this.vehicles.filter(v => v.isOnline).length;
    const offline = total - online;
    const idle = this.vehicles.filter(v => v.status === 'idle').length;
    const alerts = this.vehicles.filter(v => v.alerts && v.alerts.length > 0).length;

    this.metrics = {
      ...this.metrics,
      total,
      online,
      offline,
      idle,
      alerts,
      totalVehicles: total,
      onlineVehicles: online,
      offlineVehicles: offline,
      recentlyActiveVehicles: this.vehicles.filter(v => v.is_active).length,
      lastSyncTime: new Date(),
    };
  }

  getMetrics(): ServiceMetrics {
    return this.metrics;
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }

  getVehicleById(deviceId: string): VehicleData | undefined {
    return this.vehicles.find(v => v.device_id === deviceId);
  }
}

export const enhancedVehicleDataService = new EnhancedVehicleDataService();
