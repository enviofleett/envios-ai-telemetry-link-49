
export interface VehiclePosition {
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: number;
  course?: number;
  altitude?: number;
}

export interface VehicleData {
  id: string;
  device_id: string;
  device_name: string;
  name: string; // Added missing property
  gp51_device_id: string;
  last_position: VehiclePosition;
  isOnline: boolean;
  isMoving: boolean;
  is_active: boolean; // Added missing property
  alerts: any[]; // Added missing property
  lastUpdate: Date;
  vehicleName?: string;
  status?: string;
  fuel_level?: number;
  driver_name?: string;
  license_plate?: string;
  vehicle_type?: string;
  group_id?: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  // Add commonly accessed properties directly for compatibility
  speed?: number;
  course?: number;
}

export interface VehicleMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  movingVehicles: number;
  idleVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number; // Added missing property
  lastSyncTime: Date;
  averageSpeed: number;
  totalDistance: number;
  // Add sync-related properties for dashboard compatibility
  syncStatus: 'success' | 'error' | 'syncing';
  errors: string[];
  errorMessage?: string;
}

export interface SyncMetrics {
  lastSyncTime: Date;
  successfulSyncs: number;
  failedSyncs: number;
  totalRecords: number;
  syncDuration: number;
  errors: string[];
}

export interface VehicleEvent {
  id: string;
  vehicleId: string;
  eventType: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  location?: VehiclePosition;
}

export interface EnhancedVehicleData {
  vehicles: VehicleData[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date;
  refetch: () => Promise<void>;
  syncStatus: {
    isConnected: boolean;
    lastSync: Date;
    isSync: boolean;
  };
  forceSync: () => Promise<void>;
  events: VehicleEvent[];
  acknowledgeEvent: (eventId: string) => Promise<void>;
}

export class EnhancedVehicleDataService {
  private vehicles: VehicleData[] = [];
  private subscribers: Map<string, (data: EnhancedVehicleData) => void> = new Map();
  private isLoading: boolean = false;
  private error: Error | null = null;
  private lastUpdate: Date = new Date();
  private metrics: VehicleMetrics | null = null;
  private syncMetrics: SyncMetrics | null = null;
  private events: VehicleEvent[] = [];
  private syncStatus = {
    isConnected: false,
    lastSync: new Date(),
    isSync: false
  };

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics() {
    this.metrics = {
      totalVehicles: 0,
      onlineVehicles: 0,
      movingVehicles: 0,
      idleVehicles: 0,
      offlineVehicles: 0,
      recentlyActiveVehicles: 0,
      lastSyncTime: new Date(),
      averageSpeed: 0,
      totalDistance: 0,
      syncStatus: 'success',
      errors: [],
      errorMessage: undefined
    };

    this.syncMetrics = {
      lastSyncTime: new Date(),
      successfulSyncs: 0,
      failedSyncs: 0,
      totalRecords: 0,
      syncDuration: 0,
      errors: []
    };
  }

  // Subscribe to data updates
  subscribe(subscriberId: string, callback: (data: EnhancedVehicleData) => void): void {
    this.subscribers.set(subscriberId, callback);
    // Immediately send current data
    this.notifySubscribers();
  }

  // Unsubscribe from updates
  unsubscribe(subscriberId: string): void {
    this.subscribers.delete(subscriberId);
  }

  // Get vehicle data
  async getVehicleData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;
      this.notifySubscribers();

      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with actual API integration
      this.vehicles = this.generateMockVehicles();
      this.lastUpdate = new Date();
      this.updateMetrics();
      
    } catch (error) {
      this.error = error instanceof Error ? error : new Error('Failed to fetch vehicle data');
      throw this.error;
    } finally {
      this.isLoading = false;
      this.notifySubscribers();
    }
  }

  // Get enhanced vehicles with real-time data
  async getEnhancedVehicles(): Promise<VehicleData[]> {
    await this.getVehicleData();
    return this.vehicles;
  }

  // Get current metrics
  getMetrics(): VehicleMetrics | null {
    return this.metrics;
  }

  // Get sync metrics
  getLastSyncMetrics(): SyncMetrics | null {
    return this.syncMetrics;
  }

  // Force sync with GP51
  async forceSync(): Promise<void> {
    try {
      this.syncStatus.isSync = true;
      this.notifySubscribers();

      const startTime = Date.now();
      
      // Simulate sync process
      await this.getVehicleData();
      
      const syncDuration = Date.now() - startTime;
      
      // Update sync metrics
      if (this.syncMetrics) {
        this.syncMetrics.lastSyncTime = new Date();
        this.syncMetrics.successfulSyncs++;
        this.syncMetrics.syncDuration = syncDuration;
        this.syncMetrics.totalRecords = this.vehicles.length;
      }

      if (this.metrics) {
        this.metrics.syncStatus = 'success';
        this.metrics.errors = [];
        this.metrics.errorMessage = undefined;
      }

      this.syncStatus.lastSync = new Date();
      this.syncStatus.isConnected = true;
      
    } catch (error) {
      if (this.syncMetrics) {
        this.syncMetrics.failedSyncs++;
        this.syncMetrics.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
      }
      
      if (this.metrics) {
        this.metrics.syncStatus = 'error';
        this.metrics.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
        this.metrics.errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      }
      
      this.syncStatus.isConnected = false;
      throw error;
    } finally {
      this.syncStatus.isSync = false;
      this.notifySubscribers();
    }
  }

  // Get vehicle by ID
  getVehicleById(vehicleId: string): VehicleData | null {
    return this.vehicles.find(v => v.id === vehicleId) || null;
  }

  // Acknowledge event
  async acknowledgeEvent(eventId: string): Promise<void> {
    const eventIndex = this.events.findIndex(e => e.id === eventId);
    if (eventIndex >= 0) {
      this.events[eventIndex].acknowledged = true;
      this.notifySubscribers();
    }
  }

  // Get current enhanced data
  getCurrentData(): EnhancedVehicleData {
    return {
      vehicles: this.vehicles,
      isLoading: this.isLoading,
      error: this.error,
      lastUpdate: this.lastUpdate,
      refetch: () => this.getVehicleData(),
      syncStatus: this.syncStatus,
      forceSync: () => this.forceSync(),
      events: this.events,
      acknowledgeEvent: (eventId: string) => this.acknowledgeEvent(eventId)
    };
  }

  // Private methods
  private notifySubscribers(): void {
    const data = this.getCurrentData();
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  private updateMetrics(): void {
    if (!this.metrics) return;

    const recentlyActive = this.vehicles.filter(v => {
      if (!v.last_position?.timestamp) return false;
      const lastUpdate = new Date(v.last_position.timestamp);
      const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
      return lastUpdate.getTime() > thirtyMinutesAgo;
    }).length;

    this.metrics.totalVehicles = this.vehicles.length;
    this.metrics.onlineVehicles = this.vehicles.filter(v => v.isOnline).length;
    this.metrics.movingVehicles = this.vehicles.filter(v => v.isMoving).length;
    this.metrics.idleVehicles = this.vehicles.filter(v => v.isOnline && !v.isMoving).length;
    this.metrics.offlineVehicles = this.vehicles.filter(v => !v.isOnline).length;
    this.metrics.recentlyActiveVehicles = recentlyActive;
    this.metrics.lastSyncTime = new Date();
    
    // Calculate average speed
    const movingVehicles = this.vehicles.filter(v => v.isMoving);
    this.metrics.averageSpeed = movingVehicles.length > 0 
      ? movingVehicles.reduce((sum, v) => sum + (v.last_position?.speed || 0), 0) / movingVehicles.length
      : 0;
  }

  private generateMockVehicles(): VehicleData[] {
    // Generate mock data - replace with actual GP51 integration
    return Array.from({ length: 10 }, (_, i) => {
      const speed = Math.random() * 100;
      const course = Math.random() * 360;
      
      return {
        id: `vehicle_${i + 1}`,
        device_id: `device_${i + 1}`,
        device_name: `Vehicle ${i + 1}`,
        name: `Fleet Vehicle ${i + 1}`,
        gp51_device_id: `gp51_${i + 1}`,
        last_position: {
          latitude: 52.0 + Math.random() * 0.1,
          longitude: 4.3 + Math.random() * 0.1,
          speed,
          timestamp: Date.now(),
          course,
          altitude: 10 + Math.random() * 100
        },
        isOnline: Math.random() > 0.2,
        isMoving: Math.random() > 0.5,
        is_active: true,
        alerts: [],
        lastUpdate: new Date(),
        vehicleName: `Fleet Vehicle ${i + 1}`,
        status: Math.random() > 0.8 ? 'maintenance' : 'active',
        fuel_level: Math.random() * 100,
        driver_name: `Driver ${i + 1}`,
        license_plate: `ABC-${1000 + i}`,
        vehicle_type: 'truck',
        group_id: `group_${Math.floor(i / 3) + 1}`,
        owner_id: 'octopus',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add compatibility properties
        speed,
        course
      };
    });
  }
}

// Export singleton instance
export const enhancedVehicleDataService = new EnhancedVehicleDataService();
