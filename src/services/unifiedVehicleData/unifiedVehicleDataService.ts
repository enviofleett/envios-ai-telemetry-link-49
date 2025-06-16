
import { dataLoader } from './dataLoader';
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

class UnifiedVehicleDataService {
  private static instance: UnifiedVehicleDataService;
  private vehicles: VehicleData[] = [];
  private metrics: VehicleDataMetrics = {
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
    syncStatus: 'success'
  };

  static getInstance(): UnifiedVehicleDataService {
    if (!UnifiedVehicleDataService.instance) {
      UnifiedVehicleDataService.instance = new UnifiedVehicleDataService();
    }
    return UnifiedVehicleDataService.instance;
  }

  async loadVehicleData(): Promise<VehicleData[]> {
    try {
      this.vehicles = await dataLoader.loadFromGP51();
      this.updateMetrics();
      return this.vehicles;
    } catch (error) {
      console.error('Failed to load vehicle data:', error);
      this.vehicles = await dataLoader.loadFromDatabase();
      this.updateMetrics();
      return this.vehicles;
    }
  }

  private updateMetrics(): void {
    const total = this.vehicles.length;
    const online = this.vehicles.filter(v => v.status === 'online').length;
    const offline = this.vehicles.filter(v => v.status === 'offline').length;
    const idle = this.vehicles.filter(v => v.status === 'idle').length;
    const alerts = this.vehicles.filter(v => v.alerts && v.alerts.length > 0).length;

    this.metrics = {
      total,
      online,
      offline,
      idle,
      alerts,
      totalVehicles: total,
      onlineVehicles: online,
      offlineVehicles: offline,
      recentlyActiveVehicles: online + idle,
      lastSyncTime: new Date(),
      positionsUpdated: total,
      errors: 0,
      syncStatus: 'success'
    };
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

export const unifiedVehicleDataService = UnifiedVehicleDataService.getInstance();
