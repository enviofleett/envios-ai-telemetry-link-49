
export interface SyncMetrics {
  totalVehicles: number;
  positionsUpdated: number;
  errors: number;
  lastSyncTime: Date;
}

export interface VehiclePosition {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

export interface GP51SessionInfo {
  username: string;
  token: string;
  expiresAt: string;
}

export interface GP51PositionRecord {
  deviceid: string;
  callat: number;
  callon: number;
  speed: number;
  course: number;
  updatetime: string;
  strstatusen: string;
}
