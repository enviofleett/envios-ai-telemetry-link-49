
// Consolidated Vehicle type definitions
export interface VehiclePosition {
  lat: number;
  lng: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

export interface Vehicle {
  deviceid: string; // Required for GP51 compatibility
  devicename: string;
  plateNumber: string;
  status: 'online' | 'offline' | 'moving' | 'idle';
  is_active: boolean;
  envio_user_id?: string;
  lastPosition?: VehiclePosition;
}

export interface VehicleData {
  id: string;
  deviceId: string;
  deviceName: string;
  vehicleName?: string;
  make?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  status: 'online' | 'offline' | 'idle' | 'moving';
  lastUpdate: Date;
  position?: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    address?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    address?: string;
  };
  speed?: number;
  course?: number;
  isOnline: boolean;
  isMoving: boolean;
  fuel?: number;
  battery?: number;
  temperature?: number;
  alerts: string[];
}

export interface VehicleDataMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
}

export interface VehicleMetrics {
  total: number;
  online: number;
  offline: number;
  alerts: number;
  lastUpdateTime: Date;
}

export interface SyncMetrics {
  totalVehicles: number;
  positionsUpdated: number;
  errors: number;
  lastSyncTime: Date;
}

export interface FilterState {
  search: string;
  status: string;
  user: string;
  online: string;
}

export interface VehicleStatistics {
  total: number;
  active: number;
  online: number;
  alerts: number;
}
