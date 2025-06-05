import { supabase } from '@/integrations/supabase/client';
import { vehiclePositionSyncService } from './vehiclePosition/vehiclePositionSyncService';
import type { SyncMetrics } from './vehiclePosition/types';

interface Vehicle {
  deviceid: string;
  devicename: string;
  status?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
  envio_user_id?: string;
  is_active: boolean;
}

interface VehicleMetrics {
  total: number;
  online: number;
  offline: number;
  alerts: number;
  lastUpdateTime: Date;
}

export class UnifiedVehicleDataService {
  private vehicles: Vehicle[] = [];
  private totalVehiclesInDatabase: number = 0;
  private metrics: VehicleMetrics = {
    total: 0,
    online: 0,
    offline: 0,
    alerts: 0,
    lastUpdateTime: new Date()
  };
  private isInitialized = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    console.log('Initializing unified vehicle data service...');
    
    // Load initial data from database
    await this.loadVehiclesFromDatabase();
    
    // Start the sync service for real-time updates
    vehiclePositionSyncService.startPeriodicSync(30000);
    
    // Set up periodic data refresh
    this.startDataRefresh();
    
    this.isInitialized = true;
    this.notifyListeners();
  }

  private async loadVehiclesFromDatabase(): Promise<void> {
    try {
      // Get total count of active vehicles first
      const { count: totalCount, error: countError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) throw countError;
      
      this.totalVehiclesInDatabase = totalCount || 0;
      console.log(`Total active vehicles in database: ${this.totalVehiclesInDatabase}`);

      // Load vehicle data with position information
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      this.vehicles = (data || []).map(vehicle => ({
        deviceid: vehicle.device_id,
        devicename: vehicle.device_name,
        status: vehicle.status,
        envio_user_id: vehicle.envio_user_id,
        is_active: vehicle.is_active,
        lastPosition: this.parseLastPosition(vehicle.last_position)
      }));

      this.updateMetrics();
      console.log(`Loaded ${this.vehicles.length} vehicles with position data from database`);
    } catch (error) {
      console.error('Failed to load vehicles from database:', error);
    }
  }

  private parseLastPosition(lastPosition: any): Vehicle['lastPosition'] {
    if (!lastPosition || typeof lastPosition !== 'object') return undefined;
    
    return {
      lat: lastPosition.lat || 0,
      lon: lastPosition.lon || 0,
      speed: lastPosition.speed || 0,
      course: lastPosition.course || 0,
      updatetime: lastPosition.updatetime || '',
      statusText: lastPosition.statusText || ''
    };
  }

  private updateMetrics(): void {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Calculate online/offline based on loaded vehicles with position data
    const vehiclesWithPositions = this.vehicles.filter(v => v.lastPosition?.updatetime);
    const onlineVehicles = vehiclesWithPositions.filter(v => 
      new Date(v.lastPosition!.updatetime) > thirtyMinutesAgo
    );
    const offlineVehicles = vehiclesWithPositions.filter(v => 
      new Date(v.lastPosition!.updatetime) <= thirtyMinutesAgo
    );

    // Calculate alerts from all loaded vehicles
    const alertVehicles = this.vehicles.filter(v => 
      v.status?.toLowerCase().includes('alert') || 
      v.status?.toLowerCase().includes('alarm')
    );

    this.metrics = {
      total: this.totalVehiclesInDatabase, // Always use database total
      online: onlineVehicles.length,
      offline: offlineVehicles.length,
      alerts: alertVehicles.length,
      lastUpdateTime: now
    };

    console.log(`Metrics updated - Total: ${this.metrics.total}, Online: ${this.metrics.online}, Offline: ${this.metrics.offline}, Alerts: ${this.metrics.alerts}`);
  }

  private startDataRefresh(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      await this.refreshData();
    }, 60000); // Refresh every minute
  }

  public async refreshData(): Promise<void> {
    try {
      // Force sync with GP51
      await vehiclePositionSyncService.forceSync();
      
      // Reload from database
      await this.loadVehiclesFromDatabase();
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to refresh vehicle data:', error);
    }
  }

  public getAllVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  public getVehicleMetrics(): VehicleMetrics {
    return { ...this.metrics };
  }

  public getSyncMetrics(): SyncMetrics {
    return vehiclePositionSyncService.getMetrics();
  }

  public getVehicleById(deviceId: string): Vehicle | undefined {
    return this.vehicles.find(v => v.deviceid === deviceId);
  }

  public getOnlineVehicles(): Vehicle[] {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return this.vehicles.filter(v => 
      v.lastPosition?.updatetime && 
      new Date(v.lastPosition.updatetime) > thirtyMinutesAgo
    );
  }

  public getOfflineVehicles(): Vehicle[] {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return this.vehicles.filter(v => 
      v.lastPosition?.updatetime && 
      new Date(v.lastPosition.updatetime) <= thirtyMinutesAgo
    );
  }

  public getVehiclesWithAlerts(): Vehicle[] {
    return this.vehicles.filter(v => 
      v.status?.toLowerCase().includes('alert') || 
      v.status?.toLowerCase().includes('alarm')
    );
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  public async forceSync(): Promise<void> {
    await this.refreshData();
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    vehiclePositionSyncService.stopPeriodicSync();
    this.listeners.clear();
  }
}

export const unifiedVehicleDataService = new UnifiedVehicleDataService();
