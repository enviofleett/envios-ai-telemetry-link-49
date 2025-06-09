
export interface Vehicle {
  deviceid: string;
  devicename: string;
  plateNumber: string;
  status: 'online' | 'offline' | 'moving' | 'idle';
  is_active: boolean;
  envio_user_id?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
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
