
import { supabase } from '@/integrations/supabase/client';
import { vehiclePositionSyncService } from '../vehiclePosition/vehiclePositionSyncService';
import type { Vehicle } from '../unifiedVehicleData';

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
    let status = 'offline';
    if (lastPosition?.updatetime) {
      const lastUpdate = new Date(lastPosition.updatetime);
      const minutesSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
      
      if (minutesSinceUpdate <= 5) {
        status = lastPosition.speed > 0 ? 'moving' : 'online';
      }
    }

    return {
      deviceid: dbVehicle.device_id,
      devicename: dbVehicle.device_name,
      plateNumber: dbVehicle.device_name, // Use device name as plate number fallback
      status,
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

  getVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  getMetrics(): DataMetrics {
    return { ...this.metrics };
  }

  getVehicleById(deviceId: string): Vehicle | undefined {
    return this.vehicles.find(v => v.deviceid === deviceId);
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
  }
}

export const unifiedVehicleDataService = UnifiedVehicleDataService.getInstance();
