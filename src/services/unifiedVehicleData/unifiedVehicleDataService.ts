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
    const lastPosition = dbVehicle.last_position;
    
    // Determine vehicle status based on last position update
    let status: 'online' | 'offline' | 'moving' | 'idle' = 'offline';
    let parsedPosition: VehicleData['last_position'] = undefined;
    
    if (lastPosition?.updatetime) {
      const lastUpdate = new Date(lastPosition.updatetime);
      const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
      
      if (minutesSinceUpdate <= 5) {
        status = lastPosition.speed > 0 ? 'moving' : 'online';
      } else if (minutesSinceUpdate <= 30) {
        status = 'idle';
      }

      // Transform position with proper timestamp conversion
      parsedPosition = {
        lat: lastPosition.lat,
        lng: lastPosition.lng,
        speed: lastPosition.speed || 0,
        course: lastPosition.course || 0,
        timestamp: lastPosition.updatetime, // Keep as string
      };
    }

    return {
      id: dbVehicle.id || dbVehicle.device_id,
      device_id: dbVehicle.device_id,
      device_name: dbVehicle.device_name,
      vehicleName: dbVehicle.device_name,
      status,
      lastUpdate: parsedPosition ? new Date(parsedPosition.timestamp) : new Date(dbVehicle.updated_at || dbVehicle.created_at),
      alerts: [],
      isOnline: status === 'online' || status === 'moving',
      isMoving: status === 'moving',
      speed: lastPosition?.speed || 0,
      course: lastPosition?.course || 0,
      is_active: dbVehicle.is_active || true,
      envio_user_id: dbVehicle.envio_user_id,
      last_position: parsedPosition
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
    const hasRecentPosition = rawVehicle.last_position && 
      rawVehicle.last_position.timestamp &&
      (Date.now() - new Date(rawVehicle.last_position.timestamp).getTime()) < (5 * 60 * 1000);

    return {
      id: rawVehicle.id || rawVehicle.device_id,
      device_id: rawVehicle.device_id,
      device_name: rawVehicle.device_name,
      status: isOnline ? (hasRecentPosition ? 'online' : 'idle') : 'offline',
      lastUpdate: new Date(rawVehicle.updated_at || rawVehicle.created_at || Date.now()),
      last_position: rawVehicle.last_position,
      isOnline: isOnline && hasRecentPosition,
      isMoving: rawVehicle.last_position?.speed > 0 || false,
      alerts: rawVehicle.alerts || [],
      is_active: rawVehicle.is_active || false,
      // Legacy compatibility
      device_id: rawVehicle.device_id,
      device_name: rawVehicle.device_name
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
