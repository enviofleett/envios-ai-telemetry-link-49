
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
    movingVehicles: 0,
    idleVehicles: 0,
    recentlyActiveVehicles: 0,
    lastSyncTime: new Date(),
    averageSpeed: 0,
    totalDistance: 0,
    syncStatus: 'success',
    errors: []
  };
  private subscribers: (() => void)[] = [];
  private ready = false;

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
      this.ready = true;
      this.notifySubscribers();
      return this.vehicles;
    } catch (error) {
      console.error('Failed to load vehicle data:', error);
      this.vehicles = await dataLoader.loadFromDatabase();
      this.updateMetrics();
      this.ready = true;
      this.notifySubscribers();
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
      movingVehicles: this.vehicles.filter(v => v.isMoving).length,
      idleVehicles: idle,
      recentlyActiveVehicles: online + idle,
      lastSyncTime: new Date(),
      averageSpeed: 0,
      totalDistance: 0,
      syncStatus: 'success',
      errors: []
    };
  }

  getVehicles(): VehicleData[] {
    return this.vehicles;
  }

  getMetrics(): VehicleDataMetrics {
    return this.metrics;
  }

  // New method for dashboard compatibility
  getVehicleMetrics(): VehicleDataMetrics {
    return this.metrics;
  }

  // New method to check if service is ready
  isReady(): boolean {
    return this.ready;
  }

  // New method to subscribe to updates
  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }

  getVehicleById(deviceId: string): VehicleData | undefined {
    return this.vehicles.find(v => v.device_id === deviceId);
  }
}

export const unifiedVehicleDataService = UnifiedVehicleDataService.getInstance();
