
import { supabase } from '@/integrations/supabase/client';
import { vehiclePositionSyncService } from '../vehiclePosition/vehiclePositionSyncService';
import type { Vehicle, VehicleMetrics, SyncMetrics } from './types';

interface DataMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  lastSyncTime: Date;
  syncStatus: 'syncing' | 'success' | 'failed' | 'partial';
}

export class UnifiedVehicleDataService {
  private static instance: UnifiedVehicleDataService;
  private vehicles: Vehicle[] = [];
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
    
    // Start position sync service
    vehiclePositionSyncService.startPeriodicSync();
    
    // Subscribe to sync status updates
    vehiclePositionSyncService.subscribeToStatus((status) => {
      this.metrics.syncStatus = status as any;
      this.metrics.lastSyncTime = new Date();
      this.notifyListeners();
      
      // Reload data after successful sync
      if (status === 'success' || status === 'partial') {
        this.loadVehiclesFromDatabase();
      }
    });

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

  private transformDatabaseVehicle(dbVehicle: any): Vehicle {
    const lastPosition = dbVehicle.last_position;
    
    // Determine vehicle status based on last position update
    let status: 'online' | 'offline' | 'moving' | 'idle' = 'offline';
    if (lastPosition?.updatetime) {
      const lastUpdate = new Date(lastPosition.updatetime);
      const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
      
      if (minutesSinceUpdate <= 5) {
        status = lastPosition.speed > 0 ? 'moving' : 'online';
      } else if (minutesSinceUpdate <= 30) {
        status = 'idle';
      }
    }

    return {
      deviceid: dbVehicle.device_id,
      devicename: dbVehicle.device_name,
      plateNumber: dbVehicle.device_name, // Use device_name as plateNumber
      status,
      is_active: dbVehicle.is_active || true,
      envio_user_id: dbVehicle.envio_user_id,
      lastPosition: lastPosition ? {
        lat: lastPosition.lat,
        lon: lastPosition.lon,
        speed: lastPosition.speed || 0,
        course: lastPosition.course || 0,
        updatetime: lastPosition.updatetime,
        statusText: lastPosition.statusText || ''
      } : undefined
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
      // Force position sync
      await vehiclePositionSyncService.forceSync();
      
      // Reload from database
      await this.loadVehiclesFromDatabase();
      
      console.log('✅ Vehicle data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh vehicle data:', error);
      this.metrics.syncStatus = 'failed';
      this.notifyListeners();
    }
  }

  // Public API methods
  getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  getAllVehicles(): Vehicle[] {
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

  getVehicleById(deviceId: string): Vehicle | undefined {
    return this.vehicles.find(v => v.deviceid === deviceId);
  }

  getOnlineVehicles(): Vehicle[] {
    return this.vehicles.filter(v => v.status === 'online' || v.status === 'moving');
  }

  getOfflineVehicles(): Vehicle[] {
    return this.vehicles.filter(v => v.status === 'offline');
  }

  getVehiclesWithAlerts(): Vehicle[] {
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
    vehiclePositionSyncService.destroy();
    this.listeners.clear();
    this.ready = false;
  }
}

export const unifiedVehicleDataService = UnifiedVehicleDataService.getInstance();
