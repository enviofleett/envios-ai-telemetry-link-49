
import type { VehicleData as TypesVehicleData } from '@/types/vehicle';

export interface VehiclePosition {
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  course?: number;
  altitude?: number;
}

export interface VehicleData {
  id: string;
  device_id: string;
  device_name: string;
  gp51_device_id: string;
  name: string;
  user_id?: string;
  sim_number?: string;
  created_at: string;
  updated_at: string;
  last_position?: VehiclePosition;
  isOnline: boolean;
  isMoving: boolean;
  lastUpdate: Date;
  vehicleName?: string;
  status?: string;
  fuel_level?: number;
  driver_name?: string;
  license_plate?: string;
  vehicle_type?: string;
  group_id?: string;
  owner_id?: string;
  is_active?: boolean;
  alerts?: any[];
  speed?: number;
  course?: number;
  vin?: string;
  envio_users?: any;
}

export interface VehicleMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  movingVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles?: number;
  lastSyncTime: Date;
  averageSpeed: number;
  totalDistance: number;
  syncStatus?: string;
  errors?: string[];
  errorMessage?: string;
  total: number;
  online: number;
  offline: number;
  idle: number;
  alerts: number;
}

export interface SyncMetrics {
  lastSyncTime: Date;
  successfulSyncs: number;
  failedSyncs: number;
  totalRecords: number;
  syncDuration: number;
  errors: string[];
}

export interface VehicleEvent {
  id: string;
  vehicleId: string;
  eventType: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  location?: VehiclePosition;
}

export interface EnhancedVehicleData {
  vehicles: VehicleData[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  lastUpdate: Date;
  refetch: () => Promise<void>;
  syncStatus: {
    isConnected: boolean;
    lastSync: Date;
    isSync: boolean;
  };
  forceSync: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  events: VehicleEvent[];
  acknowledgeEvent: (eventId: string) => Promise<void>;
  metrics: VehicleMetrics;
  isConnected: boolean;
  allVehicles: VehicleData[];
  filteredVehicles: VehicleData[];
  userOptions: any[];
}

export class EnhancedVehicleDataService {
  private vehicles: VehicleData[] = [];
  private subscribers: Map<string, (data: EnhancedVehicleData) => void> = new Map();
  private isLoading: boolean = false;
  private isRefreshing: boolean = false;
  private error: Error | null = null;
  private lastUpdate: Date = new Date();
  private metrics: VehicleMetrics | null = null;
  private syncMetrics: SyncMetrics | null = null;
  private events: VehicleEvent[] = [];
  private syncStatus = {
    isConnected: false,
    lastSync: new Date(),
    isSync: false
  };

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    this.metrics = {
      totalVehicles: 0,
      onlineVehicles: 0,
      movingVehicles: 0,
      idleVehicles: 0,
      offlineVehicles: 0,
      recentlyActiveVehicles: 0,
      lastSyncTime: new Date(),
      averageSpeed: 0,
      totalDistance: 0,
      syncStatus: 'success',
      errors: [],
      total: 0,
      online: 0,
      offline: 0,
      idle: 0,
      alerts: 0
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
    return this.getVehicleData();
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
      this.isRefreshing = true;
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
      
    } catch (error) {
      if (this.syncMetrics) {
        this.syncMetrics.failedSyncs++;
        this.syncMetrics.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      }
      this.syncStatus.isConnected = false;
      throw error;
    } finally {
      this.syncStatus.isSync = false;
      this.isRefreshing = false;
      this.notifySubscribers();
    }
  }

  async forceRefresh(): Promise<void> {
    return this.forceSync();
  }

  getVehicleById(vehicleId: string): VehicleData | null {
    return this.vehicles.find(v => v.id === vehicleId) || null;
  }

  async acknowledgeEvent(eventId: string): Promise<void> {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex >= 0) {
      this.events[eventIndex].acknowledged = true;
      this.notifySubscribers();
    }
  }

  getCurrentData(): EnhancedVehicleData {
    return {
      vehicles: this.vehicles,
      isLoading: this.isLoading,
      isRefreshing: this.isRefreshing,
      error: this.error,
      lastUpdate: this.lastUpdate,
      refetch: () => this.getVehicleData(),
      syncStatus: this.syncStatus,
      forceSync: () => this.forceSync(),
      forceRefresh: () => this.forceRefresh(),
      events: this.events,
      acknowledgeEvent: (eventId: string) => this.acknowledgeEvent(eventId),
      metrics: this.metrics || {
        totalVehicles: 0,
        onlineVehicles: 0,
        movingVehicles: 0,
        idleVehicles: 0,
        offlineVehicles: 0,
        lastSyncTime: new Date(),
        averageSpeed: 0,
        totalDistance: 0,
        total: 0,
        online: 0,
        offline: 0,
        idle: 0,
        alerts: 0
      },
      isConnected: this.syncStatus.isConnected,
      allVehicles: this.vehicles,
      filteredVehicles: this.vehicles,
      userOptions: this.vehicles.map(v => ({
        label: v.vehicleName || v.device_name,
        value: v.id
      }))
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

    this.metrics.totalVehicles = this.vehicles.length;
    this.metrics.onlineVehicles = this.vehicles.filter(v => v.isOnline).length;
    this.metrics.movingVehicles = this.vehicles.filter(v => v.isMoving).length;
    this.metrics.idleVehicles = this.vehicles.filter(v => v.isOnline && !v.isMoving).length;
    this.metrics.offlineVehicles = this.vehicles.filter(v => !v.isOnline).length;
    this.metrics.lastSyncTime = new Date();
    this.metrics.total = this.vehicles.length;
    this.metrics.online = this.metrics.onlineVehicles;
    this.metrics.offline = this.metrics.offlineVehicles;
    this.metrics.idle = this.metrics.idleVehicles;
    this.metrics.alerts = this.events.filter(e => !e.acknowledged).length;
    
    const movingVehicles = this.vehicles.filter(v => v.isMoving);
    this.metrics.averageSpeed = movingVehicles.length > 0 
      ? movingVehicles.reduce((sum, v) => sum + (v.last_position?.speed || 0), 0) / movingVehicles.length
      : 0;
  }

  private generateMockVehicles(): VehicleData[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `vehicle_${i + 1}`,
      device_id: `device_${i + 1}`,
      device_name: `Vehicle ${i + 1}`,
      gp51_device_id: `gp51_${i + 1}`,
      name: `Vehicle ${i + 1}`,
      user_id: 'user1',
      sim_number: '1234567890',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      vehicleName: `Fleet Vehicle ${i + 1}`,
      status: Math.random() > 0.8 ? 'maintenance' : 'active',
      fuel_level: Math.random() * 100,
      driver_name: `Driver ${i + 1}`,
      license_plate: `ABC-${1000 + i}`,
      vehicle_type: 'truck',
      group_id: `group_${Math.floor(i / 3) + 1}`,
      owner_id: 'octopus',
      is_active: true,
      alerts: [],
      speed: Math.random() * 100,
      course: Math.random() * 360,
      vin: `VIN${i + 1}234567890`
    }));
  }
}

export const enhancedVehicleDataService = new EnhancedVehicleDataService();
