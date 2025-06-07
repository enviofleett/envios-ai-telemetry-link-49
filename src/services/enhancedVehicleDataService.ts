
import { supabase } from '@/integrations/supabase/client';
import { gp51SessionManager } from './gp51SessionManager';
import { VehicleData, VehicleDataMetrics } from './vehicleData/types';
import { VehicleDataProcessor } from './vehicleData/vehicleDataProcessor';
import { MetricsCalculator } from './vehicleData/metricsCalculator';
import { GP51ApiService } from './vehicleData/gp51ApiService';

// Re-export types for backward compatibility
export type { VehicleData, VehicleDataMetrics };

export class EnhancedVehicleDataService {
  private static instance: EnhancedVehicleDataService;
  private vehicles: VehicleData[] = [];
  private metrics: VehicleDataMetrics = {
    totalVehicles: 0,
    onlineVehicles: 0,
    offlineVehicles: 0,
    recentlyActiveVehicles: 0,
    lastSyncTime: new Date(),
    syncStatus: 'success'
  };
  private listeners: Set<() => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  static getInstance(): EnhancedVehicleDataService {
    if (!EnhancedVehicleDataService.instance) {
      EnhancedVehicleDataService.instance = new EnhancedVehicleDataService();
    }
    return EnhancedVehicleDataService.instance;
  }

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    console.log('🚀 Initializing Enhanced Vehicle Data Service...');
    
    await this.loadVehiclesFromDatabase();
    this.startPeriodicSync();
    
    gp51SessionManager.subscribe((session) => {
      if (session) {
        console.log('✅ GP51 session available, starting data sync...');
        this.forceSync();
      } else {
        console.log('❌ GP51 session lost, marking vehicles as offline...');
        this.markAllVehiclesOffline();
      }
    });
  }

  private async loadVehiclesFromDatabase(): Promise<void> {
    try {
      console.log('📊 Loading vehicles from database...');
      
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Failed to load vehicles from database:', error);
        return;
      }

      this.vehicles = VehicleDataProcessor.transformDatabaseVehicles(vehicles || []);
      this.updateMetrics();
      console.log(`📊 Loaded ${this.vehicles.length} vehicles from database`);
      this.notifyListeners();

    } catch (error) {
      console.error('Error loading vehicles from database:', error);
    }
  }

  private startPeriodicSync(intervalMs: number = 120000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`⏰ Starting periodic vehicle data sync (${intervalMs}ms interval)`);
    
    this.syncVehicleData();
    this.syncInterval = setInterval(() => {
      this.syncVehicleData();
    }, intervalMs);
  }

  public async syncVehicleData(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    this.isSyncing = true;
    this.metrics.syncStatus = 'in_progress';
    this.notifyListeners();

    try {
      console.log('🔄 Starting vehicle data sync with GP51...');
      
      await gp51SessionManager.validateAndEnsureSession();
      
      const gp51Vehicles = await GP51ApiService.fetchVehicleList();
      console.log(`📋 Retrieved ${gp51Vehicles.length} vehicles from GP51`);

      const deviceIds = gp51Vehicles.map(v => v.deviceid).filter(Boolean);
      
      if (deviceIds.length > 0) {
        const positions = await GP51ApiService.fetchPositions(deviceIds);
        const positionMap = new Map(positions.map(pos => [pos.deviceid, pos]));

        this.vehicles = VehicleDataProcessor.processVehicleData(gp51Vehicles, positionMap);
        this.updateMetrics();
        this.metrics.syncStatus = 'success';
        this.metrics.lastSyncTime = new Date();
        delete this.metrics.errorMessage;

        console.log(`✅ Vehicle data sync completed. ${this.metrics.onlineVehicles}/${this.metrics.totalVehicles} vehicles online`);
      } else {
        console.warn('⚠️ No vehicle device IDs found');
        this.metrics.syncStatus = 'success';
        this.metrics.lastSyncTime = new Date();
      }

    } catch (error) {
      console.error('❌ Vehicle data sync failed:', error);
      this.metrics.syncStatus = 'error';
      this.metrics.errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      this.markAllVehiclesOffline();
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private markAllVehiclesOffline(): void {
    this.vehicles = this.vehicles.map(vehicle => ({
      ...vehicle,
      status: 'offline' as const
    }));
    this.updateMetrics();
  }

  private updateMetrics(): void {
    this.metrics = MetricsCalculator.calculateMetrics(
      this.vehicles, 
      this.metrics.lastSyncTime, 
      this.metrics.syncStatus, 
      this.metrics.errorMessage
    );
  }

  public async forceSync(): Promise<void> {
    console.log('🔄 Force syncing vehicle data...');
    await this.syncVehicleData();
  }

  public getVehicles(): VehicleData[] {
    return [...this.vehicles];
  }

  public getMetrics(): VehicleDataMetrics {
    return { ...this.metrics };
  }

  public getVehicleById(deviceId: string): VehicleData | undefined {
    return this.vehicles.find(v => v.deviceId === deviceId);
  }

  public subscribe(callback: () => void): () => void {
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
        console.error('Error notifying vehicle data listener:', error);
      }
    });
  }

  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    this.listeners.clear();
  }
}

export const enhancedVehicleDataService = EnhancedVehicleDataService.getInstance();
