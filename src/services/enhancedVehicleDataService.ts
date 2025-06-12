
import { gp51DataService, type VehiclePosition } from '@/services/gp51/GP51DataService';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

interface PaginationParams {
  page?: number;
  limit?: number;
}

class EnhancedVehicleDataService {
  private static instance: EnhancedVehicleDataService;
  private vehicles: Map<string, VehicleData> = new Map();
  private metrics: VehicleDataMetrics = {
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    recentlyActiveVehicles: 0,
    lastSyncTime: new Date(),
    syncStatus: 'pending'
  };
  private subscribers: Set<() => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly syncIntervalMs = 30000; // 30 seconds

  static getInstance(): EnhancedVehicleDataService {
    if (!EnhancedVehicleDataService.instance) {
      EnhancedVehicleDataService.instance = new EnhancedVehicleDataService();
    }
    return EnhancedVehicleDataService.instance;
  }

  private constructor() {
    this.startPeriodicSync();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in vehicle data subscriber:', error);
      }
    });
  }

  private calculateMetrics(): void {
    const vehicleArray = Array.from(this.vehicles.values());
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    this.metrics = {
      totalVehicles: vehicleArray.length,
      onlineVehicles: vehicleArray.filter(v => v.isOnline).length,
      offlineVehicles: vehicleArray.filter(v => !v.isOnline).length,
      recentlyActiveVehicles: vehicleArray.filter(v => v.lastUpdate > thirtyMinutesAgo).length,
      lastSyncTime: new Date(),
      syncStatus: 'success'
    };
  }

  private mapGP51ToVehicleData(gp51Vehicle: VehiclePosition, supabaseData?: any): VehicleData {
    const vehicleData: VehicleData = {
      id: supabaseData?.id || gp51Vehicle.deviceId,
      deviceId: gp51Vehicle.deviceId,
      deviceName: gp51Vehicle.deviceName || 'Unknown Device',
      vehicleName: supabaseData?.device_name || gp51Vehicle.deviceName,
      status: gp51Vehicle.isMoving ? 'moving' : (gp51Vehicle.isOnline ? 'idle' : 'offline'),
      lastUpdate: gp51Vehicle.timestamp,
      isOnline: gp51Vehicle.isOnline,
      isMoving: gp51Vehicle.isMoving,
      alerts: gp51Vehicle.statusText && gp51Vehicle.statusText !== 'Normal' ? [gp51Vehicle.statusText] : [],
      speed: gp51Vehicle.speed,
      course: gp51Vehicle.course,
      is_active: supabaseData?.is_active || gp51Vehicle.isOnline
    };

    if (gp51Vehicle.latitude && gp51Vehicle.longitude) {
      const positionData = {
        latitude: gp51Vehicle.latitude,
        longitude: gp51Vehicle.longitude,
        speed: gp51Vehicle.speed,
        course: gp51Vehicle.course,
        address: undefined
      };
      vehicleData.position = positionData;
      vehicleData.location = positionData; // Add location alias
    }

    return vehicleData;
  }

  async getEnhancedVehicles(params: PaginationParams = {}): Promise<{ data: VehicleData[]; error: string | null; hasMore: boolean }> {
    const { page = 0, limit = 100 } = params;
    
    try {
      console.log(`🔄 Fetching enhanced vehicles (page ${page}, limit ${limit})...`);
      
      const startIndex = page * limit;
      const endIndex = startIndex + limit - 1; // Supabase range is inclusive

      // Get vehicle metadata from Supabase with pagination
      const { data: supabaseVehicles, error: supabaseError } = await supabase
        .from('vehicles')
        .select('*')
        .range(startIndex, endIndex)
        .order('device_name');

      if (supabaseError) {
        throw new Error(`Supabase error: ${supabaseError.message}`);
      }

      if (!supabaseVehicles || supabaseVehicles.length === 0) {
        return { data: [], error: null, hasMore: false };
      }

      // Get live data from GP51
      const gp51Vehicles = await gp51DataService.getDeviceList();
      
      // Get positions for the fetched devices
      const deviceIds = supabaseVehicles.map(v => v.device_id);
      const positions = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);

      const vehicles: VehicleData[] = [];

      // Process Supabase vehicles with GP51 data
      for (const supabaseVehicle of supabaseVehicles) {
        const gp51Position = positions.get(supabaseVehicle.device_id) ||
                            gp51Vehicles.find(v => v.deviceId === supabaseVehicle.device_id);
        
        if (gp51Position) {
          const vehicleData = this.mapGP51ToVehicleData(gp51Position, supabaseVehicle);
          vehicles.push(vehicleData);
        } else {
          // Create offline vehicle entry
          const offlineVehicle: VehicleData = {
            id: supabaseVehicle.id,
            deviceId: supabaseVehicle.device_id,
            deviceName: supabaseVehicle.device_name || 'Unknown Device',
            vehicleName: supabaseVehicle.device_name,
            status: 'offline',
            lastUpdate: new Date(supabaseVehicle.updated_at || supabaseVehicle.created_at),
            isOnline: false,
            isMoving: false,
            alerts: ['No GPS signal'],
            speed: 0,
            course: 0,
            is_active: supabaseVehicle.is_active || false
          };
          vehicles.push(offlineVehicle);
        }
      }

      const hasMore = supabaseVehicles.length === limit; // If we got fewer than limit, no more pages

      console.log(`✅ Enhanced vehicle fetch completed: ${vehicles.length} vehicles (hasMore: ${hasMore})`);
      
      return { data: vehicles, error: null, hasMore };
      
    } catch (error) {
      console.error('❌ Enhanced vehicle fetch failed:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown fetch error',
        hasMore: false 
      };
    }
  }

  async syncWithGP51(): Promise<void> {
    try {
      console.log('🔄 Starting enhanced vehicle data sync with GP51...');
      
      // Get vehicle metadata from Supabase
      const { data: supabaseVehicles, error: supabaseError } = await supabase
        .from('vehicles')
        .select('*');

      if (supabaseError) {
        throw new Error(`Supabase error: ${supabaseError.message}`);
      }

      // Get live data from GP51
      const gp51Vehicles = await gp51DataService.getDeviceList();
      
      // Get positions for all devices
      const deviceIds = gp51Vehicles.map(v => v.deviceId);
      const positions = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);

      // Clear existing vehicles
      this.vehicles.clear();

      // Process Supabase vehicles with GP51 data
      if (supabaseVehicles) {
        for (const supabaseVehicle of supabaseVehicles) {
          const gp51Position = positions.get(supabaseVehicle.device_id) ||
                              gp51Vehicles.find(v => v.deviceId === supabaseVehicle.device_id);
          
          if (gp51Position) {
            const vehicleData = this.mapGP51ToVehicleData(gp51Position, supabaseVehicle);
            this.vehicles.set(vehicleData.deviceId, vehicleData);
          } else {
            // Create offline vehicle entry
            const offlineVehicle: VehicleData = {
              id: supabaseVehicle.id,
              deviceId: supabaseVehicle.device_id,
              deviceName: supabaseVehicle.device_name || 'Unknown Device',
              vehicleName: supabaseVehicle.device_name,
              status: 'offline',
              lastUpdate: new Date(supabaseVehicle.updated_at || supabaseVehicle.created_at),
              isOnline: false,
              isMoving: false,
              alerts: ['No GPS signal'],
              speed: 0,
              course: 0,
              is_active: supabaseVehicle.is_active || false
            };
            this.vehicles.set(offlineVehicle.deviceId, offlineVehicle);
          }
        }
      }

      // Add GP51-only vehicles (not in Supabase)
      for (const gp51Vehicle of gp51Vehicles) {
        if (!this.vehicles.has(gp51Vehicle.deviceId)) {
          const position = positions.get(gp51Vehicle.deviceId) || gp51Vehicle;
          const vehicleData = this.mapGP51ToVehicleData(position);
          this.vehicles.set(vehicleData.deviceId, vehicleData);
        }
      }

      this.calculateMetrics();
      console.log(`✅ Enhanced vehicle sync completed: ${this.vehicles.size} vehicles`);
      
    } catch (error) {
      console.error('❌ Enhanced vehicle sync failed:', error);
      this.metrics.syncStatus = 'error';
      this.metrics.errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    }

    this.notifySubscribers();
  }

  async forceSync(): Promise<void> {
    await this.syncWithGP51();
  }

  private startPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncWithGP51();
    }, this.syncIntervalMs);

    // Initial sync
    this.syncWithGP51();
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  getVehicles(): VehicleData[] {
    return Array.from(this.vehicles.values());
  }

  getVehicleById(deviceId: string): VehicleData | undefined {
    return this.vehicles.get(deviceId);
  }

  getOnlineVehicles(): VehicleData[] {
    return this.getVehicles().filter(v => v.isOnline);
  }

  getOfflineVehicles(): VehicleData[] {
    return this.getVehicles().filter(v => !v.isOnline);
  }

  getVehiclesWithAlerts(): VehicleData[] {
    return this.getVehicles().filter(v => v.alerts.length > 0);
  }

  getMetrics(): VehicleDataMetrics {
    return { ...this.metrics };
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.subscribers.clear();
    this.vehicles.clear();
  }
}

export const enhancedVehicleDataService = EnhancedVehicleDataService.getInstance();

// Export the new paginated function for use in hooks
export const getEnhancedVehicles = (params?: PaginationParams) => {
  return enhancedVehicleDataService.getEnhancedVehicles(params);
};

export const getVehicleDataMetrics = (vehicles: VehicleData[]) => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  
  return {
    totalVehicles: vehicles.length,
    onlineVehicles: vehicles.filter(v => v.isOnline).length,
    offlineVehicles: vehicles.filter(v => !v.isOnline).length,
    recentlyActiveVehicles: vehicles.filter(v => v.lastUpdate > thirtyMinutesAgo).length,
    lastSyncTime: new Date(),
    syncStatus: 'success' as const
  };
};
