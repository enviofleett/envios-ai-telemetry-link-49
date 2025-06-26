
import { 
  VehicleData, 
  VehiclePosition, 
  VehicleMetrics, 
  SyncMetrics, 
  VehicleEvent, 
  EnhancedVehicleData 
} from '@/types/vehicle';

// Define SyncStatus as an object interface, not a union
export interface SyncStatus {
  isConnected: boolean;
  lastSync: Date;
  isSync: boolean;
  status?: string;
}

export class EnhancedVehicleDataService {
  private vehicles: VehicleData[] = [];
  private subscribers: Map<string, (data: EnhancedVehicleData) => void> = new Map();
  private isLoading: boolean = false;
  private error: Error | null = null;
  private lastUpdate: Date = new Date();
  private metrics: VehicleMetrics | null = null;
  private syncMetrics: SyncMetrics | null = null;
  private events: VehicleEvent[] = [];
  private syncStatus: SyncStatus = {
    isConnected: false,
    lastSync: new Date(),
    isSync: false,
    status: 'disconnected'
  };

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    this.metrics = {
      total: 0,
      online: 0,
      offline: 0,
      idle: 0,
      alerts: 0,
      totalVehicles: 0,
      onlineVehicles: 0,
      movingVehicles: 0,
      idleVehicles: 0,
      offlineVehicles: 0,
      recentlyActiveVehicles: 0,
      lastSyncTime: new Date(),
      averageSpeed: 0,
      totalDistance: 0,
      syncStatus: 'disconnected',
      errors: [],
      errorMessage: undefined
    };

    this.syncMetrics = {
      lastSyncTime: new Date(),
      successfulSyncs: 0,
      failedSyncs: 0,
      totalRecords: 0,
      syncDuration: 0,
      errors: []
    };
  }

  subscribe(subscriberId: string, callback: (data: EnhancedVehicleData) => void): void {
    this.subscribers.set(subscriberId, callback);
    this.notifySubscribers();
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

  async getEnhancedVehicles(): Promise<VehicleData[]> {
    return await this.getVehicleData();
  }

  getMetrics(): VehicleMetrics | null {
    return this.metrics;
  }

  getLastSyncMetrics(): SyncMetrics | null {
    return this.syncMetrics;
  }

  async forceSync(): Promise<void> {
    try {
      this.syncStatus.isSync = true;
      this.notifySubscribers();

      const startTime = Date.now();
      await this.getVehicleData();
      const syncDuration = Date.now() - startTime;
      
      if (this.syncMetrics) {
        this.syncMetrics.lastSyncTime = new Date();
        this.syncMetrics.successfulSyncs++;
        this.syncMetrics.syncDuration = syncDuration;
        this.syncMetrics.totalRecords = this.vehicles.length;
      }

      this.syncStatus.lastSync = new Date();
      this.syncStatus.isConnected = true;
      this.syncStatus.status = 'connected';
      
    } catch (error) {
      if (this.syncMetrics) {
        this.syncMetrics.failedSyncs++;
        this.syncMetrics.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      }
      this.syncStatus.isConnected = false;
      this.syncStatus.status = 'error';
      throw error;
    } finally {
      this.syncStatus.isSync = false;
      this.notifySubscribers();
    }
  }

  getVehicleById(vehicleId: string): VehicleData | null {
    return this.vehicles.find(v => v.id === vehicleId) || null;
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
      isLoading: this.isLoading,
      error: this.error,
      lastUpdate: this.lastUpdate,
      refetch: async () => { await this.getVehicleData(); },
      syncStatus: this.syncStatus.status || 'disconnected',
      isConnected: this.syncStatus.isConnected,
      forceSync: () => this.forceSync(),
      events: this.events,
      acknowledgeEvent: (eventId: string) => this.acknowledgeEvent(eventId)
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
    if (!this.metrics) return;

    const total = this.vehicles.length;
    const online = this.vehicles.filter(v => v.isOnline).length;
    const moving = this.vehicles.filter(v => v.isMoving).length;
    const idle = this.vehicles.filter(v => v.isOnline && !v.isMoving).length;
    const offline = this.vehicles.filter(v => !v.isOnline).length;

    this.metrics.total = total;
    this.metrics.online = online;
    this.metrics.offline = offline;
    this.metrics.idle = idle;
    this.metrics.alerts = 0;

    this.metrics.totalVehicles = total;
    this.metrics.onlineVehicles = online;
    this.metrics.movingVehicles = moving;
    this.metrics.idleVehicles = idle;
    this.metrics.offlineVehicles = offline;
    this.metrics.recentlyActiveVehicles = online;
    this.metrics.lastSyncTime = new Date();
    
    const movingVehicles = this.vehicles.filter(v => v.isMoving);
    this.metrics.averageSpeed = movingVehicles.length > 0 
      ? movingVehicles.reduce((sum, v) => sum + (v.last_position?.speed || 0), 0) / movingVehicles.length
      : 0;
      
    this.metrics.syncStatus = this.syncStatus.isConnected ? 'connected' : 'disconnected';
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
        timestamp: Date.now(),
        course: Math.random() * 360,
        altitude: 10 + Math.random() * 100
      },
      isOnline: Math.random() > 0.2,
      isMoving: Math.random() > 0.5,
      lastUpdate: new Date(),
      is_active: Math.random() > 0.1,
      vehicleName: `Fleet Vehicle ${i + 1}`,
      status: Math.random() > 0.8 ? 'maintenance' : 'active',
      fuel_level: Math.random() * 100,
      driver_name: `Driver ${i + 1}`,
      license_plate: `ABC-${1000 + i}`,
      vehicle_type: 'truck',
      group_id: `group_${Math.floor(i / 3) + 1}`,
      owner_id: 'octopus',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      alerts: []
    }));
  }
}

export const enhancedVehicleDataService = new EnhancedVehicleDataService();

// Export types for external use
export type { VehicleData, VehicleEvent, EnhancedVehicleData } from '@/types/vehicle';
