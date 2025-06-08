// Unified vehicle data interface for GPS51 integration
export interface Vehicle {
  deviceid: string;
  devicename: string;
  status?: string;
  is_active: boolean;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText?: string;
  };
  envio_user_id?: string;
}

// Renamed to match expected interface name
export interface VehicleMetrics {
  total: number;
  online: number;
  offline: number;
  alerts: number;
  lastUpdateTime: Date;
}

// Keep backward compatibility
export interface VehicleDataMetrics extends VehicleMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

// Basic service implementation for the unified vehicle data
export class UnifiedVehicleDataService {
  private vehicles: Vehicle[] = [];
  private metrics: VehicleMetrics = {
    total: 0,
    online: 0,
    offline: 0,
    alerts: 0,
    lastUpdateTime: new Date()
  };

  getAllVehicles(): Vehicle[] {
    return [...this.vehicles];
  }

  getVehicleMetrics(): VehicleMetrics {
    return { ...this.metrics };
  }

  getVehicleById(deviceId: string): Vehicle | undefined {
    return this.vehicles.find(v => v.deviceid === deviceId);
  }

  subscribe(callback: () => void): () => void {
    // Basic subscription mechanism
    return () => {};
  }

  isReady(): boolean {
    return true;
  }
}

// Export singleton instance
export const unifiedVehicleDataService = new UnifiedVehicleDataService();
