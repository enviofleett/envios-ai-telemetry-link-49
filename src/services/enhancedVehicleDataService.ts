
import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51ProcessedPosition, LiveVehicleFilterConfig } from '@/types/gp51';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

class EnhancedVehicleDataService {
  private static instance: EnhancedVehicleDataService;
  private vehicles: VehicleData[] = [];
  private metrics: VehicleDataMetrics = this.getDefaultMetrics();
  private subscribers: Array<() => void> = [];
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startAutoSync();
  }

  static getInstance(): EnhancedVehicleDataService {
    if (!EnhancedVehicleDataService.instance) {
      EnhancedVehicleDataService.instance = new EnhancedVehicleDataService();
    }
    return EnhancedVehicleDataService.instance;
  }

  private getDefaultMetrics(): VehicleDataMetrics {
    return {
      total: 0,
      online: 0,
      offline: 0,
      idle: 0,
      alerts: 0,
      totalVehicles: 0,
      onlineVehicles: 0,
      offlineVehicles: 0,
      recentlyActiveVehicles: 0,
      lastSyncTime: new Date(),
      positionsUpdated: 0,
      errors: 0,
      syncStatus: 'pending'
    };
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  startAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncWithGP51();
    }, 60000); // Sync every 60 seconds
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async syncWithGP51(): Promise<void> {
    try {
      console.log('🔄 EnhancedVehicleDataService: Starting GP51 sync...');
      
      const liveDataResult = await gp51DataService.getLiveVehicles({
        includeOffline: true
      });

      if (!liveDataResult.success) {
        throw new Error(liveDataResult.error || 'Failed to fetch live vehicle data');
      }

      const liveData = liveDataResult.data;
      if (!liveData) {
        throw new Error('No live data received from GP51');
      }

      // Transform GP51 data to VehicleData format
      const vehiclePositions = new Map<string, GP51ProcessedPosition>();
      liveData.telemetry.forEach(pos => vehiclePositions.set(pos.deviceId, pos));

      const transformedVehicles: VehicleData[] = liveData.devices.map(device => {
        const position = vehiclePositions.get(device.deviceId);
        const lastUpdate = position?.timestamp || new Date();

        return {
          id: device.deviceId,
          device_id: device.deviceId,
          device_name: device.deviceName,
          is_active: true,
          vehicle_name: device.deviceName,
          plateNumber: device.deviceName,
          model: 'Unknown Model',
          driver: 'Unknown Driver',
          lastUpdate: lastUpdate,
          location: {
            lat: position?.latitude || 0,
            lng: position?.longitude || 0,
            address: position?.statusText || 'Unknown Location'
          },
          speed: position?.speed || 0,
          fuel: Math.floor(Math.random() * 100),
          status: position?.isOnline ? 'online' : 'offline',
          isOnline: position?.isOnline || false,
          isMoving: position?.isMoving || false,
          engineHours: Math.floor(Math.random() * 8000) + 1000,
          mileage: Math.floor(Math.random() * 200000) + 50000,
          fuelType: 'Gasoline',
          engineSize: 2.0 + Math.random() * 2,
          alerts: [],
          lastPosition: {
            lat: position?.latitude || 0,
            lng: position?.longitude || 0,
            speed: position?.speed || 0,
            course: position?.course || 0,
            updatetime: lastUpdate.toISOString(),
            statusText: position?.statusText || 'No data'
          }
        };
      });

      this.vehicles = transformedVehicles;
      this.metrics = this.calculateMetrics(transformedVehicles);
      this.notifySubscribers();

      console.log(`✅ EnhancedVehicleDataService: Sync completed - ${transformedVehicles.length} vehicles`);
    } catch (error) {
      console.error('❌ EnhancedVehicleDataService: Sync failed:', error);
      this.metrics = {
        ...this.metrics,
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Sync failed'
      };
      this.notifySubscribers();
    }
  }

  private calculateMetrics(vehicles: VehicleData[]): VehicleDataMetrics {
    const onlineVehicles = vehicles.filter(v => v.status === 'online');
    const offlineVehicles = vehicles.filter(v => v.status === 'offline');
    const recentlyActiveVehicles = vehicles.filter(v => {
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      return v.lastUpdate.getTime() > thirtyMinutesAgo;
    });

    return {
      total: vehicles.length,
      online: onlineVehicles.length,
      offline: offlineVehicles.length,
      idle: onlineVehicles.length - recentlyActiveVehicles.length,
      alerts: 0, // Placeholder
      totalVehicles: vehicles.length,
      onlineVehicles: onlineVehicles.length,
      offlineVehicles: offlineVehicles.length,
      recentlyActiveVehicles: recentlyActiveVehicles.length,
      lastSyncTime: new Date(),
      positionsUpdated: vehicles.length,
      errors: this.metrics.syncStatus === 'error' ? 1 : 0,
      syncStatus: 'success',
      errorMessage: undefined
    };
  }

  async forceSync(): Promise<void> {
    await this.syncWithGP51();
  }

  getVehicles(): VehicleData[] {
    return this.vehicles;
  }

  getMetrics(): VehicleDataMetrics {
    return this.metrics;
  }

  getVehicleById(deviceId: string): VehicleData | undefined {
    return this.vehicles.find(v => v.device_id === deviceId);
  }
}

export const enhancedVehicleDataService = EnhancedVehicleDataService.getInstance();

// Export functions for backwards compatibility
export const getEnhancedVehicles = async (options: { page: number; limit: number }) => {
  const vehicles = enhancedVehicleDataService.getVehicles();
  const startIndex = options.page * options.limit;
  const endIndex = startIndex + options.limit;
  const pageData = vehicles.slice(startIndex, endIndex);
  
  return {
    data: pageData,
    error: null,
    hasMore: endIndex < vehicles.length
  };
};

export const getVehicleDataMetrics = (vehicles: VehicleData[]): VehicleDataMetrics => {
  const onlineVehicles = vehicles.filter(v => v.status === 'online');
  const offlineVehicles = vehicles.filter(v => v.status === 'offline');
  const recentlyActiveVehicles = vehicles.filter(v => {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    return v.lastUpdate.getTime() > thirtyMinutesAgo;
  });

  return {
    total: vehicles.length,
    online: onlineVehicles.length,
    offline: offlineVehicles.length,
    idle: onlineVehicles.length - recentlyActiveVehicles.length,
    alerts: 0,
    totalVehicles: vehicles.length,
    onlineVehicles: onlineVehicles.length,
    offlineVehicles: offlineVehicles.length,
    recentlyActiveVehicles: recentlyActiveVehicles.length,
    lastSyncTime: new Date(),
    positionsUpdated: vehicles.length,
    errors: 0,
    syncStatus: 'success'
  };
};
