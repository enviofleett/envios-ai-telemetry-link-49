
import { 
  VehicleData, 
  VehiclePosition, 
  VehicleMetrics, 
  SyncMetrics, 
  VehicleEvent, 
  SyncStatusData, 
  EnhancedVehicleData 
} from '@/types/vehicle';

export class EnhancedVehicleDataService {
  private vehicles: VehicleData[] = [];
  private subscribers: Map<string, (data: EnhancedVehicleData) => void> = new Map();
  private isLoading: boolean = false;
  private isRefreshing: boolean = false;
  private error: Error | null = null;
  private lastUpdate: Date = new Date();
  private metrics: VehicleMetrics;
  private events: VehicleEvent[] = [];
  private syncStatus: SyncStatusData = {
    isConnected: false,
    lastSync: new Date(),
    isSync: false
  };

  constructor() {
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): VehicleMetrics {
    return {
      totalVehicles: 0,
      onlineVehicles: 0,
      offlineVehicles: 0,
      movingVehicles: 0,
      idleVehicles: 0,
      recentlyActiveVehicles: 0,
      lastSyncTime: new Date(),
      averageSpeed: 0,
      totalDistance: 0,
      syncStatus: 'pending',
      errors: [],
      errorMessage: undefined,
      total: 0,
      online: 0,
      offline: 0,
      idle: 0,
      alerts: 0
    };
  }

  subscribe(subscriberId: string, callback: (data: EnhancedVehicleData) => void): () => void {
    this.subscribers.set(subscriberId, callback);
    this.notifySubscribers();
    return () => this.unsubscribe(subscriberId);
  }

  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  async getVehicleData(): Promise<VehicleData[]> {
    try {
      this.isLoading = true;
      this.error = null;
      this.notifySubscribers();

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.vehicles = this.generateMockVehicles();
      this.lastUpdate = new Date();
      this.updateMetrics();
      
      return this.vehicles;
    } catch (error) {
      this.error = error instanceof Error ? error : new Error('Failed to fetch vehicle data');
      throw this.error;
    } finally {
      this.isLoading = false;
      this.notifySubscribers();
    }
  }

  getMetrics(): VehicleMetrics {
    return this.metrics;
  }

  async forceSync(): Promise<void> {
    try {
      this.syncStatus.isSync = true;
      this.isRefreshing = true;
      this.notifySubscribers();

      await this.getVehicleData();
      
      this.syncStatus.lastSync = new Date();
      this.syncStatus.isConnected = true;
      this.metrics.syncStatus = 'success';
      
    } catch (error) {
      this.syncStatus.isConnected = false;
      this.metrics.syncStatus = 'error';
      this.error = error instanceof Error ? error : new Error('Sync failed');
      throw error;
    } finally {
      this.syncStatus.isSync = false;
      this.isRefreshing = false;
      this.notifySubscribers();
    }
  }

  async acknowledgeEvent(eventId: string): Promise<void> {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex >= 0) {
      this.events[eventIndex].isAcknowledged = true;
      this.notifySubscribers();
    }
  }

  getCurrentData(): EnhancedVehicleData {
    return {
      vehicles: this.vehicles,
      allVehicles: this.vehicles,
      filteredVehicles: this.vehicles,
      userOptions: this.vehicles.map(v => ({
        id: v.id,
        name: v.vehicleName || v.device_name,
        email: `${v.device_name}@fleet.local`
      })),
      isLoading: this.isLoading,
      isRefreshing: this.isRefreshing,
      error: this.error,
      lastUpdate: this.lastUpdate,
      refetch: () => this.getVehicleData(),
      syncStatus: this.syncStatus,
      isConnected: this.syncStatus.isConnected,
      forceSync: () => this.forceSync(),
      forceRefresh: () => this.forceSync(),
      events: this.events,
      acknowledgeEvent: (eventId: string) => this.acknowledgeEvent(eventId),
      metrics: this.metrics
    };
  }

  private notifySubscribers(): void {
    const data = this.getCurrentData();
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  private updateMetrics(): void {
    const total = this.vehicles.length;
    const online = this.vehicles.filter(v => v.isOnline).length;
    const moving = this.vehicles.filter(v => v.isMoving).length;
    const idle = this.vehicles.filter(v => v.isOnline && !v.isMoving).length;
    const offline = this.vehicles.filter(v => !v.isOnline).length;

    this.metrics = {
      ...this.metrics,
      total,
      online,
      offline,
      idle,
      alerts: 0,
      totalVehicles: total,
      onlineVehicles: online,
      movingVehicles: moving,
      idleVehicles: idle,
      offlineVehicles: offline,
      recentlyActiveVehicles: online,
      lastSyncTime: new Date(),
      averageSpeed: moving > 0 
        ? this.vehicles.filter(v => v.isMoving).reduce((sum, v) => sum + (v.speed || 0), 0) / moving
        : 0
    };
  }

  private generateMockVehicles(): VehicleData[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `vehicle_${i + 1}`,
      device_id: `device_${i + 1}`,
      device_name: `Vehicle ${i + 1}`,
      name: `Vehicle ${i + 1}`,
      gp51_device_id: `gp51_${i + 1}`,
      last_position: {
        latitude: 52.0 + Math.random() * 0.1,
        longitude: 4.3 + Math.random() * 0.1,
        speed: Math.random() * 100,
        timestamp: new Date().toISOString(),
        course: Math.random() * 360
      },
      isOnline: Math.random() > 0.2,
      isMoving: Math.random() > 0.5,
      lastUpdate: new Date(),
      is_active: Math.random() > 0.1,
      vehicleName: `Fleet Vehicle ${i + 1}`,
      status: Math.random() > 0.8 ? 'maintenance' : 'active',
      plateNumber: `ABC-${1000 + i}`,
      model: `Vehicle Model ${i + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      alerts: []
    }));
  }
}

export const enhancedVehicleDataService = new EnhancedVehicleDataService();

// Export types that are needed by other files
export type { VehicleData, VehicleEvent, EnhancedVehicleData };
