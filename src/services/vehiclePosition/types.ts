
export interface VehiclePositionData {
  deviceid: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

export interface SyncMetrics {
  totalVehicles: number;
  positionsUpdated: number;
  errors: number;
  lastSyncTime: Date;
}

export interface SessionValidationResult {
  valid: boolean;
  error?: string;
}
