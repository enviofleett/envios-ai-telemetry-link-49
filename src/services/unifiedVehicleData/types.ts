
export interface Vehicle {
  deviceid: string;
  devicename: string;
  plateNumber?: string; // Add plate number field
  status?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
  envio_user_id?: string;
  is_active: boolean;
}

export interface VehicleMetrics {
  total: number;
  online: number;
  offline: number;
  alerts: number;
  lastUpdateTime: Date;
}
