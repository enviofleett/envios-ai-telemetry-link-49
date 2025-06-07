
import { supabase } from '@/integrations/supabase/client';
import { gp51SessionManager } from './gp51SessionManager';

export interface VehicleData {
  deviceId: string;
  deviceName: string;
  status: 'online' | 'offline' | 'unknown';
  lastUpdate: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  speed?: number;
  course?: number;
  additionalData?: Record<string, any>;
}

export interface VehicleDataMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  syncStatus: 'success' | 'error' | 'in_progress';
  errorMessage?: string;
}

// Type definitions for GP51 API responses
interface GP51Vehicle {
  deviceid: number;
  devicename: string;
  [key: string]: any;
}

interface GP51Position {
  deviceid: number;
  servertime: number;
  lat: number;
  lng: number;
  speed?: number;
  course?: number;
  [key: string]: any;
}

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
    
    // Load initial data from database
    await this.loadVehiclesFromDatabase();
    
    // Start periodic sync with GP51
    this.startPeriodicSync();
    
    // Subscribe to session changes
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

      // Transform database vehicles to our format
      this.vehicles = (vehicles || []).map(vehicle => ({
        deviceId: vehicle.device_id,
        deviceName: vehicle.device_name || `Vehicle ${vehicle.device_id}`,
        status: 'unknown' as const,
        lastUpdate: new Date(vehicle.updated_at || vehicle.created_at),
        additionalData: (vehicle.gp51_metadata as Record<string, any>) || {}
      }));

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
    
    // Initial sync
    this.syncVehicleData();

    // Set up periodic sync
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
      
      // Ensure we have a valid session
      const session = await gp51SessionManager.validateAndEnsureSession();
      
      // Get vehicle list from GP51
      const { data: vehicleListData, error: listError } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'querymonitorlist',
          username: session.username
        }
      });

      if (listError || vehicleListData?.status !== 0) {
        throw new Error(`Failed to get vehicle list: ${listError?.message || vehicleListData?.cause}`);
      }

      const gp51Vehicles: GP51Vehicle[] = vehicleListData.records || vehicleListData.monitors || [];
      console.log(`📋 Retrieved ${gp51Vehicles.length} vehicles from GP51`);

      // Get position data for all vehicles
      const deviceIds = gp51Vehicles.map((v: GP51Vehicle) => v.deviceid).filter(Boolean);
      
      if (deviceIds.length > 0) {
        const { data: positionData, error: positionError } = await supabase.functions.invoke('gp51-service-management', {
          body: { 
            action: 'lastposition',
            deviceids: deviceIds
          }
        });

        // Process vehicle data (even if position fetch partially fails)
        const positions: GP51Position[] = positionData?.status === 0 ? (positionData.positions || []) : [];
        const positionMap = new Map<number, GP51Position>(positions.map((pos: GP51Position) => [pos.deviceid, pos]));

        // Update vehicle data
        this.vehicles = gp51Vehicles.map((vehicle: GP51Vehicle) => {
          const position = positionMap.get(vehicle.deviceid);
          const lastUpdate = position?.servertime ? new Date(position.servertime * 1000) : new Date();
          const timeSinceUpdate = Date.now() - lastUpdate.getTime();
          
          return {
            deviceId: vehicle.deviceid.toString(),
            deviceName: vehicle.devicename || `Vehicle ${vehicle.deviceid}`,
            status: this.determineVehicleStatus(timeSinceUpdate, position),
            lastUpdate,
            location: position ? {
              latitude: position.lat,
              longitude: position.lng
            } : undefined,
            speed: position?.speed || 0,
            course: position?.course || 0,
            additionalData: {
              ...vehicle,
              position: position || null
            }
          };
        });

        // Update metrics
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

  private determineVehicleStatus(timeSinceUpdate: number, position?: GP51Position): 'online' | 'offline' | 'unknown' {
    if (!position) return 'unknown';
    
    // Consider vehicle online if updated within last 15 minutes
    if (timeSinceUpdate <= 15 * 60 * 1000) {
      return 'online';
    }
    
    // Consider offline if no update for more than 2 hours
    if (timeSinceUpdate > 2 * 60 * 60 * 1000) {
      return 'offline';
    }
    
    return 'unknown';
  }

  private markAllVehiclesOffline(): void {
    this.vehicles = this.vehicles.map(vehicle => ({
      ...vehicle,
      status: 'offline' as const
    }));
    this.updateMetrics();
  }

  private updateMetrics(): void {
    const now = Date.now();
    const recentThreshold = 30 * 60 * 1000; // 30 minutes

    this.metrics.totalVehicles = this.vehicles.length;
    this.metrics.onlineVehicles = this.vehicles.filter(v => v.status === 'online').length;
    this.metrics.offlineVehicles = this.vehicles.filter(v => v.status === 'offline').length;
    this.metrics.recentlyActiveVehicles = this.vehicles.filter(v => 
      now - v.lastUpdate.getTime() <= recentThreshold
    ).length;
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
