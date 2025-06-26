
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

export interface VehiclePosition {
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: number;
  altitude?: number;
}

export interface VehicleEvent {
  id: string;
  type: 'alert' | 'maintenance' | 'position' | 'status';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  vehicleId: string;
  isAcknowledged: boolean;
}

export interface VehicleMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  movingVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  averageSpeed: number;
  totalDistance: number;
  syncStatus: 'success' | 'error' | 'pending';
  errors: string[];
  errorMessage?: string;
  // Compatibility properties
  total: number;
  online: number;
  offline: number;
  idle: number;
  alerts: number;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSync: Date;
  isSync: boolean;
}

export interface EnhancedVehicleData {
  vehicles: VehicleData[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: Error | null;
  lastUpdate: Date;
  refetch: () => Promise<void>;
  syncStatus: SyncStatus;
  forceSync: () => Promise<void>;
  forceRefresh: () => Promise<void>;
  events: VehicleEvent[];
  acknowledgeEvent: (eventId: string) => Promise<void>;
  metrics: VehicleMetrics;
  isConnected: boolean;
  allVehicles: VehicleData[];
  filteredVehicles: VehicleData[];
  userOptions: Array<{ id: string; name: string; email: string }>;
}

class EnhancedVehicleDataService {
  private static instance: EnhancedVehicleDataService;
  private subscribers: Map<string, (data: EnhancedVehicleData) => void> = new Map();
  private currentData: EnhancedVehicleData;

  constructor() {
    this.currentData = this.getInitialData();
  }

  static getInstance(): EnhancedVehicleDataService {
    if (!EnhancedVehicleDataService.instance) {
      EnhancedVehicleDataService.instance = new EnhancedVehicleDataService();
    }
    return EnhancedVehicleDataService.instance;
  }

  private getInitialData(): EnhancedVehicleData {
    return {
      vehicles: [],
      isLoading: true,
      isRefreshing: false,
      error: null,
      lastUpdate: new Date(),
      refetch: async () => { await this.getVehicleData(); },
      syncStatus: {
        isConnected: false,
        lastSync: new Date(),
        isSync: false
      },
      forceSync: async () => { await this.forceSync(); },
      forceRefresh: async () => { await this.forceRefresh(); },
      events: [],
      acknowledgeEvent: async (eventId: string) => { await this.acknowledgeEvent(eventId); },
      metrics: {
        totalVehicles: 0,
        onlineVehicles: 0,
        movingVehicles: 0,
        idleVehicles: 0,
        offlineVehicles: 0,
        recentlyActiveVehicles: 0,
        lastSyncTime: new Date(),
        averageSpeed: 0,
        totalDistance: 0,
        syncStatus: 'pending',
        errors: [],
        total: 0,
        online: 0,
        offline: 0,
        idle: 0,
        alerts: 0
      },
      isConnected: false,
      allVehicles: [],
      filteredVehicles: [],
      userOptions: []
    };
  }

  getCurrentData(): EnhancedVehicleData {
    return this.currentData;
  }

  subscribe(subscriberId: string, callback: (data: EnhancedVehicleData) => void): void {
    this.subscribers.set(subscriberId, callback);
  }

  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.currentData);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  async getVehicleData(): Promise<void> {
    try {
      this.currentData.isLoading = true;
      this.currentData.error = null;
      this.notifySubscribers();

      const { data: vehicles, error } = await supabase
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
        `);

      if (error) {
        throw error;
      }

      const enhancedVehicles: VehicleData[] = (vehicles || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        gp51_device_id: vehicle.gp51_device_id,
        device_name: vehicle.name,
        name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: vehicle.sim_number,
        created_at: vehicle.created_at,
        updated_at: vehicle.updated_at,
        is_active: true, // Required property
        last_position: {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
          speed: Math.floor(Math.random() * 80),
          course: Math.floor(Math.random() * 360),
          timestamp: Date.now()
        },
        isOnline: Math.random() > 0.3,
        isMoving: Math.random() > 0.6,
        alerts: [],
        lastUpdate: new Date(),
        vehicleName: vehicle.name,
        speed: Math.floor(Math.random() * 80),
        course: Math.floor(Math.random() * 360),
        latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
        status: Math.random() > 0.3 ? 'online' : 'offline'
      }));

      this.currentData.vehicles = enhancedVehicles;
      this.currentData.allVehicles = enhancedVehicles;
      this.currentData.filteredVehicles = enhancedVehicles;
      this.currentData.lastUpdate = new Date();
      this.currentData.isLoading = false;
      this.currentData.syncStatus.isConnected = true;
      this.currentData.syncStatus.lastSync = new Date();
      this.currentData.isConnected = true;

      // Update metrics
      this.updateMetrics(enhancedVehicles);

      // Generate user options
      this.currentData.userOptions = enhancedVehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.vehicleName || vehicle.device_name,
        email: `${vehicle.device_name}@fleet.local`
      }));

      this.notifySubscribers();
    } catch (error) {
      this.currentData.error = error instanceof Error ? error : new Error('Unknown error');
      this.currentData.isLoading = false;
      this.notifySubscribers();
    }
  }

  private updateMetrics(vehicles: VehicleData[]): void {
    const total = vehicles.length;
    const online = vehicles.filter(v => v.isOnline).length;
    const offline = vehicles.filter(v => !v.isOnline).length;
    const moving = vehicles.filter(v => v.isMoving).length;
    const idle = vehicles.filter(v => v.isOnline && !v.isMoving).length;
    const alerts = vehicles.filter(v => v.alerts && v.alerts.length > 0).length;

    this.currentData.metrics = {
      totalVehicles: total,
      onlineVehicles: online,
      movingVehicles: moving,
      idleVehicles: idle,
      offlineVehicles: offline,
      recentlyActiveVehicles: online + moving,
      lastSyncTime: new Date(),
      averageSpeed: vehicles.reduce((sum, v) => sum + (v.speed || 0), 0) / total || 0,
      totalDistance: 0,
      syncStatus: 'success',
      errors: [],
      // Compatibility properties
      total,
      online,
      offline,
      idle,
      alerts
    };
  }

  async forceSync(): Promise<void> {
    this.currentData.isRefreshing = true;
    this.notifySubscribers();
    await this.getVehicleData();
    this.currentData.isRefreshing = false;
    this.notifySubscribers();
  }

  async forceRefresh(): Promise<void> {
    await this.forceSync();
  }

  async acknowledgeEvent(eventId: string): Promise<void> {
    this.currentData.events = this.currentData.events.map(event =>
      event.id === eventId ? { ...event, isAcknowledged: true } : event
    );
    this.notifySubscribers();
  }

  getMetrics(): VehicleMetrics {
    return this.currentData.metrics;
  }

  getLastSyncMetrics(): any {
    return {
      lastSync: this.currentData.syncStatus.lastSync,
      isConnected: this.currentData.syncStatus.isConnected,
      vehicleCount: this.currentData.vehicles.length
    };
  }
}

export const enhancedVehicleDataService = EnhancedVehicleDataService.getInstance();
export type { VehicleData };
