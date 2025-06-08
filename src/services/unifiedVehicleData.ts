
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

export interface VehicleDataMetrics {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  recentlyActiveVehicles: number;
  lastSyncTime: Date;
  syncStatus: 'success' | 'error' | 'pending';
  errorMessage?: string;
}
