
import { vehiclePositionSyncService } from '../vehiclePosition/vehiclePositionSyncService';
import type { SyncMetrics } from '../vehiclePosition/types';
import { VehicleDataLoader } from './dataLoader';
import { VehicleMetricsCalculator } from './metricsCalculator';
import type { Vehicle, VehicleMetrics } from './types';

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
  private dataLoader = new VehicleDataLoader();
  private metricsCalculator = new VehicleMetricsCalculator();

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
      const { vehicles, totalCount } = await this.dataLoader.loadVehiclesFromDatabase();
      this.vehicles = vehicles;
      this.totalVehiclesInDatabase = totalCount;
      this.updateMetrics();
    } catch (error) {
      console.error('Failed to load vehicles from database:', error);
    }
  }

  private updateMetrics(): void {
    this.metrics = this.metricsCalculator.calculateMetrics(this.vehicles, this.totalVehiclesInDatabase);
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
    return this.metricsCalculator.getOnlineVehicles(this.vehicles);
  }

  public getOfflineVehicles(): Vehicle[] {
    return this.metricsCalculator.getOfflineVehicles(this.vehicles);
  }

  public getVehiclesWithAlerts(): Vehicle[] {
    return this.metricsCalculator.getVehiclesWithAlerts(this.vehicles);
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
