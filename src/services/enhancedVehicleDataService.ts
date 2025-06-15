import { gp51DataService } from '@/services/gp51/GP51DataService';
import type { GP51ProcessedPosition } from '@/types/gp51';
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
      this.metrics.syncStatus = 'syncing';
      this.notifySubscribers();

      // Step 1: Fetch all devices
      const deviceListResult = await gp51DataService.getDeviceList();

      if (!deviceListResult.success || !deviceListResult.data) {
        throw new Error(deviceListResult.error || 'Failed to fetch device list from GP51');
      }
      
      const devices = deviceListResult.data;
      if (devices.length === 0) {
          console.log('✅ EnhancedVehicleDataService: Sync completed - no devices found.');
          this.vehicles = [];
          this.metrics = this.calculateMetrics([]);
          this.notifySubscribers();
          return;
      }
      
      const deviceIds = devices.map(d => d.deviceId);

      // Step 2: Fetch positions for all devices
      const vehiclePositions = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);

      if (vehiclePositions.size === 0) {
          console.warn('⚠️ Could not fetch positions, proceeding with device list only.');
      }

      // Step 3: Transform and merge data
      const transformedVehicles: VehicleData[] = devices.map(device => {
        const position = vehiclePositions.get(device.deviceId);
        const lastUpdate = position?.timestamp ? new Date(position.timestamp) : new Date(0);

        return {
          id: device.deviceId,
          device_id: device.deviceId,
          device_name: device.deviceName,
          user_id: null, // Not available from GP51 device list
          sim_number: null, // Not available from GP51 device list
          created_at: new Date().toISOString(), // Placeholder
          updated_at: new Date().toISOString(), // Placeholder
          is_active: true,
          vehicleName: device.deviceName,
          license_plate: device.deviceName, // Using deviceName as placeholder
          make: 'Unknown',
          model: 'Unknown Model',
          status: position?.isOnline ? 'online' : 'offline',
          last_position: position ? {
            latitude: position.latitude,
            longitude: position.longitude,
            speed: position.speed,
            course: position.course,
            timestamp: position.timestamp.toISOString()
          } : undefined,
          
          driver: {
            name: device.deviceName || 'Unknown Driver',
          },
          deliveries: [],
          deliveryStatus: position?.isOnline ? 'available' : 'offline',

          lastUpdate: lastUpdate,
          location: position ? {
            latitude: position.latitude,
            longitude: position.longitude,
            address: position.statusText || 'Unknown Location'
          } : undefined,
          speed: position?.speed || 0,
          course: position?.course || 0,
          fuel: Math.floor(Math.random() * 100),
          isOnline: position?.isOnline || false,
          isMoving: position?.isMoving || false,
          engineHours: Math.floor(Math.random() * 8000) + 1000,
          mileage: Math.floor(Math.random() * 200000) + 50000,
          fuelType: 'Gasoline',
          engineSize: 2.0 + Math.random() * 2,
          alerts: []
        };
      });

      this.vehicles = transformedVehicles;
      this.metrics = this.calculateMetrics(transformedVehicles);
      this.notifySubscribers();

      console.log(`✅ EnhancedVehicleDataService: Sync completed - ${transformedVehicles.length} vehicles processed.`);
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
      const lastUpdate = v.lastUpdate ? v.lastUpdate.getTime() : 0;
      return lastUpdate > thirtyMinutesAgo;
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
    const lastUpdate = v.lastUpdate ? v.lastUpdate.getTime() : 0;
    return lastUpdate > thirtyMinutesAgo;
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
