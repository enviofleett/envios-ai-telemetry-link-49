import { supabase } from '@/integrations/supabase/client';
import { unifiedGP51SessionManager } from './unifiedGP51SessionManager';
import { VehicleData, VehicleDataMetrics } from './vehicleData/types';
import { VehicleDataProcessor } from './vehicleData/vehicleDataProcessor';
import { MetricsCalculator } from './vehicleData/metricsCalculator';
import { GP51ApiService } from './vehicleData/gp51ApiService';
import { PositionOnlyApiService } from './vehicleData/positionOnlyApiService';

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
  private positionOnlyInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private isPositionSyncing = false;
  private isInitialized = false;

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
    
    // Load vehicles from database immediately to show data quickly
    await this.loadVehiclesFromDatabase();
    this.isInitialized = true;
    
    // Start enhanced sync in background (won't block UI)
    this.startBackgroundSync();
    
    // Subscribe to GP51 session changes for enhanced features
    unifiedGP51SessionManager.subscribeToSession((session) => {
      if (session && session.userId) {
        console.log(`✅ GP51 session available for user ${session.userId}, enabling enhanced sync...`);
        this.forceSync();
      } else {
        console.log('⚠️ GP51 session not available, using database-only mode');
        this.markVehiclesAsOfflineFromGP51();
      }
    });

    unifiedGP51SessionManager.subscribeToHealth((health) => {
      if (health.status === 'connected' || health.status === 'degraded') {
        this.forceSync();
      } else if (health.status === 'disconnected' || health.status === 'auth_error') {
        this.markVehiclesAsOfflineFromGP51();
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
        this.metrics.syncStatus = 'error';
        this.metrics.errorMessage = `Database error: ${error.message}`;
        this.notifyListeners();
        return;
      }

      // Transform database vehicles to VehicleData format
      this.vehicles = VehicleDataProcessor.transformDatabaseVehicles(vehicles || []);
      this.updateMetrics();
      this.metrics.syncStatus = 'success';
      this.metrics.lastSyncTime = new Date();
      
      console.log(`📊 Loaded ${this.vehicles.length} vehicles from database`);
      this.notifyListeners();

    } catch (error) {
      console.error('Error loading vehicles from database:', error);
      this.metrics.syncStatus = 'error';
      this.metrics.errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      this.notifyListeners();
    }
  }

  private startBackgroundSync(): void {
    // Start background sync with conservative intervals
    this.startPeriodicSync(60000); // 1 minute for full sync
    this.startPositionOnlySync(30000); // 30 seconds for position updates
  }

  private startPeriodicSync(intervalMs: number = 60000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    console.log(`⏰ Starting background vehicle data sync (${intervalMs}ms)`);
    
    // Initial sync attempt (non-blocking)
    this.syncVehicleDataInBackground();
    
    this.syncInterval = setInterval(() => {
      this.syncVehicleDataInBackground();
    }, intervalMs);
  }

  private startPositionOnlySync(intervalMs: number = 30000): void {
    if (this.positionOnlyInterval) {
      clearInterval(this.positionOnlyInterval);
    }

    console.log(`🎯 Starting background position sync (${intervalMs}ms)`);
    
    this.positionOnlyInterval = setInterval(() => {
      this.syncPositionsOnlyInBackground();
    }, intervalMs);
  }

  private async syncVehicleDataInBackground(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    try {
      await this.syncVehicleData();
    } catch (error) {
      console.warn('Background sync failed, continuing with database data:', error);
      // Don't update UI state for background sync failures
    }
  }

  private async syncPositionsOnlyInBackground(): Promise<void> {
    if (this.isPositionSyncing || this.isSyncing) {
      return;
    }

    try {
      await this.syncPositionsOnly();
    } catch (error) {
      console.warn('Background position sync failed:', error);
      // Don't update UI state for background sync failures
    }
  }

  private async syncPositionsOnly(): Promise<void> {
    this.isPositionSyncing = true;

    try {
      const session = await unifiedGP51SessionManager.validateAndEnsureSession();
      if (!session.userId) {
        return; // Skip GP51 sync, keep database data
      }

      // Get recently updated vehicles for position sync
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: activeVehicles, error } = await supabase
        .from('vehicles')
        .select('device_id, last_position')
        .eq('is_active', true)
        .gte('last_position->>updatetime', fiveMinutesAgo)
        .limit(100);

      if (error || !activeVehicles || activeVehicles.length === 0) {
        return;
      }

      const deviceIds = activeVehicles.map(v => parseInt(v.device_id)).filter(Boolean);
      
      if (deviceIds.length === 0) {
        return;
      }

      const positions = await PositionOnlyApiService.fetchPositionsOnly(deviceIds);
      
      if (positions.length > 0) {
        const result = await PositionOnlyApiService.updateVehiclePositionsInDatabase(positions);
        console.log(`🎯 Background position sync: ${result.updated} updated, ${result.errors} errors`);
        
        // Reload vehicles from database with updated positions
        await this.loadVehiclesFromDatabase();
      }

    } catch (error) {
      console.warn('Position-only sync failed:', error);
    } finally {
      this.isPositionSyncing = false;
    }
  }

  public async syncVehicleData(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      const session = await unifiedGP51SessionManager.validateAndEnsureSession();
      
      if (!session.userId) {
        console.log('GP51 session not available, using database-only mode');
        await this.loadVehiclesFromDatabase();
        return;
      }
      
      console.log(`🔗 Using GP51 session for enhanced sync: ${session.userId}`);
      
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

        console.log(`✅ Enhanced sync completed. ${this.metrics.onlineVehicles}/${this.metrics.totalVehicles} vehicles online`);
      }

    } catch (error) {
      console.warn('Enhanced sync failed, keeping database data:', error);
      // Don't mark as error - we have database data
      if (this.vehicles.length === 0) {
        // Only reload if we have no vehicles
        await this.loadVehiclesFromDatabase();
      }
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private markVehiclesAsOfflineFromGP51(): void {
    // Mark vehicles as offline for GP51 status while keeping database data
    this.vehicles = this.vehicles.map(vehicle => ({
      ...vehicle,
      status: 'offline' as const
    }));
    this.updateMetrics();
    this.notifyListeners();
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
    console.log('🔄 Force syncing enhanced vehicle data...');
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

  public isReady(): boolean {
    return this.isInitialized;
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
    if (this.positionOnlyInterval) {
      clearInterval(this.positionOnlyInterval);
    }
    this.listeners.clear();
  }
}

export const enhancedVehicleDataService = EnhancedVehicleDataService.getInstance();
