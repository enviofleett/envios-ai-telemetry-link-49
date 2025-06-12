
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
