
export interface VehicleDataMetrics {
  total: number;
  online: number;
  offline: number;
  idle: number;
  alerts: number;
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  positionsUpdated: number;
  errors: number;
  syncStatus: 'success' | 'error' | 'loading';
  errorMessage?: string;
}

export interface VehicleStatus {
  deviceId: string;
  status: 'online' | 'offline' | 'idle' | 'moving';
  lastUpdate: Date;
  position?: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
  };
}

export interface SyncMetrics {
  lastSyncTime: Date;
  positionsUpdated: number;
  errors: number;
  syncStatus: 'success' | 'error' | 'loading';
  errorMessage?: string;
}
