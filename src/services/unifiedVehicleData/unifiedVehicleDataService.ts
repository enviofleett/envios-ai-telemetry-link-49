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
    console.log('Initializing unified vehicle data service for ALL vehicles...');
    
    // Load initial data from database (ALL vehicles, not limited to 1000)
    await this.loadAllVehiclesFromDatabase();
    
    // Start the enhanced sync service for real-time updates
    vehiclePositionSyncService.startPeriodicSync(300000); // 5 minutes for full sync
    
    // Set up periodic data refresh for UI updates
    this.startDataRefresh();
    
    this.isInitialized = true;
    this.notifyListeners();
  }

  private async loadAllVehiclesFromDatabase(): Promise<void> {
    try {
      console.log('Loading ALL vehicles from database (no limits)...');
      const { vehicles, totalCount } = await this.dataLoader.loadVehiclesFromDatabase();
      this.vehicles = vehicles;
      this.totalVehiclesInDatabase = totalCount;
      this.updateMetrics();
      console.log(`Loaded ${vehicles.length} vehicles out of ${totalCount} total in database`);
    } catch (error) {
      console.error('Failed to load vehicles from database:', error);
    }
  }

  private updateMetrics(): void {
    this.metrics = this.metricsCalculator.calculateMetrics(this.vehicles, this.totalVehiclesInDatabase);
    console.log(`Metrics updated - Total: ${this.metrics.total}, Online: ${this.metrics.online}, Offline: ${this.metrics.offline}, Alerts: ${this.metrics.alerts}`);
  }

  private startDataRefresh(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // More frequent UI updates to show sync progress
    this.updateInterval = setInterval(async () => {
      await this.refreshData();
    }, 30000); // Refresh UI every 30 seconds
  }

  public async refreshData(): Promise<void> {
    try {
      // Force sync with GP51 for all vehicles
      await vehiclePositionSyncService.forceSync();
      
      // Reload from database to get latest positions
      await this.loadAllVehiclesFromDatabase();
      
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to refresh vehicle data:', error);
    }
  }

  public async getSyncProgress() {
    return await vehiclePositionSyncService.getSyncProgress();
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
    console.log('Force syncing ALL vehicle positions...');
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
