
export interface VehiclePosition {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

export interface VehicleData {
  id: string;
  deviceId: string;
  deviceName: string;
  status: 'online' | 'offline' | 'moving' | 'idle';
  lastPosition?: VehiclePosition;
  lastUpdate: Date;
  isOnline: boolean;
  metadata?: {
    simNumber?: string;
    notes?: string;
    envioUserId?: string;
    groupName?: string;
    gp51Status?: string;
    createdAt?: string;
    isActive?: boolean;
  };
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
