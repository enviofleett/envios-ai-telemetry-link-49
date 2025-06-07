
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
export interface GP51Vehicle {
  deviceid: number;
  devicename: string;
  [key: string]: any;
}

export interface GP51Position {
  deviceid: number;
  servertime: number;
  lat: number;
  lng: number;
  speed?: number;
  course?: number;
  [key: string]: any;
}
