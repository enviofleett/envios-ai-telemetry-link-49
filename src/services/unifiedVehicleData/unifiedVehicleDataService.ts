import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehicleMetrics, SyncMetrics } from '@/types/vehicle';

interface DataMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  lastSyncTime: Date;
  syncStatus: 'syncing' | 'success' | 'failed' | 'partial';
}

export class UnifiedVehicleDataService {
  private static instance: UnifiedVehicleDataService;
  private vehicles: VehicleData[] = [];
  private metrics: DataMetrics = {
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    lastSyncTime: new Date(),
    syncStatus: 'success'
  };
  private listeners: Set<() => void> = new Set();
  private ready = false;

  static getInstance(): UnifiedVehicleDataService {
    if (!UnifiedVehicleDataService.instance) {
      UnifiedVehicleDataService.instance = new UnifiedVehicleDataService();
    }
    return UnifiedVehicleDataService.instance;
  }

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    console.log('🚀 Initializing Unified Vehicle Data Service...');
    
    // Load initial data
    await this.loadVehiclesFromDatabase();
    this.ready = true;
    
    // Set up periodic data refresh (every 60 seconds)
    setInterval(() => {
      this.loadVehiclesFromDatabase();
    }, 60000);

    console.log('✅ Unified Vehicle Data Service initialized');
  }

  private async loadVehiclesFromDatabase(): Promise<void> {
    try {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('device_name');

      if (error) {
        console.error('Failed to load vehicles from database:', error);
        return;
      }

      this.vehicles = (vehicles || []).map(vehicle => this.transformDatabaseVehicle(vehicle));
      this.updateMetrics();
      this.notifyListeners();

    } catch (error) {
      console.error('Error loading vehicles from database:', error);
    }
  }

  private transformDatabaseVehicle(dbVehicle: any): VehicleData {
    const dbLastPosition = dbVehicle.last_position as any; // Treat as raw from DB
    
    let status: 'online' | 'offline' | 'moving' | 'idle' = 'offline';
    let parsedPosition: VehicleData['last_position'] = undefined;
    
    if (dbLastPosition?.updatetime) {
      const lastUpdate = new Date(dbLastPosition.updatetime);
      const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
      
      if (minutesSinceUpdate <= 5) {
        status = dbLastPosition.speed > 0 ? 'moving' : 'online';
      } else if (minutesSinceUpdate <= 30) {
        status = 'idle';
      }

      // Transform position with proper timestamp conversion
      // Ensure source properties are dbLastPosition.lat and (dbLastPosition.lng or dbLastPosition.lon)
      if (dbLastPosition.lat != null && (dbLastPosition.lng != null || dbLastPosition.lon != null)) {
        parsedPosition = {
          latitude: dbLastPosition.lat,
          longitude: dbLastPosition.lng || dbLastPosition.lon, // Handle both lng and lon
          speed: dbLastPosition.speed || 0,
          course: dbLastPosition.course || 0,
          timestamp: dbLastPosition.updatetime, // Keep as string
        };
      }
    }

    return {
      id: dbVehicle.id || dbVehicle.device_id,
      device_id: dbVehicle.device_id,
      device_name: dbVehicle.device_name,
      status,
      lastUpdate: parsedPosition ? new Date(parsedPosition.timestamp) : new Date(dbVehicle.updated_at || dbVehicle.created_at),
      alerts: [], // Ensure alerts is part of VehicleData if used
      isOnline: status === 'online' || status === 'moving',
      isMoving: status === 'moving',
      speed: parsedPosition?.speed || 0, // Use parsedPosition's speed
      course: parsedPosition?.course || 0, // Use parsedPosition's course
      is_active: dbVehicle.is_active || true,
      user_id: dbVehicle.user_id,
      last_position: parsedPosition,
      sim_number: dbVehicle.sim_number,
      created_at: dbVehicle.created_at,
      updated_at: dbVehicle.updated_at,
    };
  }

  private updateMetrics(): void {
    this.metrics.totalVehicles = this.vehicles.length;
    this.metrics.onlineVehicles = this.vehicles.filter(v => v.status === 'online' || v.status === 'moving').length;
    this.metrics.offlineVehicles = this.vehicles.filter(v => v.status === 'offline').length;
  }

  async refreshData(): Promise<void> {
    console.log('🔄 Refreshing vehicle data...');
    
    try {
      // Reload from database
      await this.loadVehiclesFromDatabase();
      
      console.log('✅ Vehicle data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh vehicle data:', error);
      this.metrics.syncStatus = 'failed';
      this.notifyListeners();
    }
  }

  private isValidVehicle(vehicle: any): boolean {
    return vehicle && 
           typeof vehicle === 'object' && 
           vehicle.device_id && 
           typeof vehicle.device_id === 'string' &&
           vehicle.device_name && 
           typeof vehicle.device_name === 'string';
  }

  private transformVehicleData(rawVehicle: any): VehicleData {
    const isOnline = rawVehicle.is_active || false;
    const rawLastPosition = rawVehicle.last_position as any;
    let appLastPosition: VehicleData['last_position'] = undefined;
    let hasRecentPosition = false;

    if (rawLastPosition && rawLastPosition.timestamp) {
        const updateTime = new Date(rawLastPosition.timestamp);
        hasRecentPosition = (Date.now() - updateTime.getTime()) < (5 * 60 * 1000);
        if (rawLastPosition.latitude != null && rawLastPosition.longitude != null) {
             appLastPosition = {
                latitude: rawLastPosition.latitude,
                longitude: rawLastPosition.longitude,
                speed: rawLastPosition.speed || 0,
                course: rawLastPosition.course || 0,
                timestamp: rawLastPosition.timestamp,
            };
        } else if (rawLastPosition.lat != null && (rawLastPosition.lng != null || rawLastPosition.lon != null) ) { // Fallback if source is lat/lng
            appLastPosition = {
                latitude: rawLastPosition.lat,
                longitude: rawLastPosition.lng || rawLastPosition.lon,
                speed: rawLastPosition.speed || 0,
                course: rawLastPosition.course || 0,
                timestamp: rawLastPosition.timestamp,
            };
        }
    }
    
    return {
      id: rawVehicle.id || rawVehicle.device_id,
      device_id: rawVehicle.device_id,
      device_name: rawVehicle.device_name,
      user_id: rawVehicle.user_id,
      sim_number: rawVehicle.sim_number,
      created_at: rawVehicle.created_at,
      updated_at: rawVehicle.updated_at,
      status: isOnline ? (hasRecentPosition ? 'online' : 'idle') : 'offline',
      lastUpdate: new Date(rawVehicle.updated_at || rawVehicle.created_at || Date.now()),
      last_position: appLastPosition,
      isOnline: isOnline && hasRecentPosition,
      isMoving: appLastPosition?.speed != null && appLastPosition.speed > 0,
      alerts: rawVehicle.alerts || [],
      is_active: rawVehicle.is_active || false
    };
  }

  // Public API methods
  getVehicles(): VehicleData[] {
    return [...this.vehicles];
  }

  getAllVehicles(): VehicleData[] {
    return [...this.vehicles];
  }

  getMetrics(): DataMetrics {
    return { ...this.metrics };
  }

  getVehicleMetrics(): VehicleMetrics {
    return {
      total: this.metrics.totalVehicles,
      online: this.metrics.onlineVehicles,
      offline: this.metrics.offlineVehicles,
      alerts: 0, // TODO: implement alerts counting
      lastUpdateTime: this.metrics.lastSyncTime
    };
  }

  getSyncMetrics(): SyncMetrics {
    return {
      totalVehicles: this.metrics.totalVehicles,
      positionsUpdated: this.metrics.onlineVehicles,
      errors: 0, // TODO: implement error counting
      lastSyncTime: this.metrics.lastSyncTime
    };
  }

  getVehicleById(device_id: string): VehicleData | undefined {
    return this.vehicles.find(v => v.device_id === device_id);
  }

  getOnlineVehicles(): VehicleData[] {
    return this.vehicles.filter(v => v.status === 'online' || v.status === 'moving');
  }

  getOfflineVehicles(): VehicleData[] {
    return this.vehicles.filter(v => v.status === 'offline');
  }

  getVehiclesWithAlerts(): VehicleData[] {
    return this.vehicles.filter(v => v.status?.toLowerCase().includes('alert') || v.status?.toLowerCase().includes('alarm'));
  }

  isReady(): boolean {
    return this.ready;
  }

  async forceSync(): Promise<void> {
    await this.refreshData();
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error notifying data listener:', error);
      }
    });
  }

  destroy(): void {
    this.listeners.clear();
    this.ready = false;
  }
}

export const unifiedVehicleDataService = UnifiedVehicleDataService.getInstance();
