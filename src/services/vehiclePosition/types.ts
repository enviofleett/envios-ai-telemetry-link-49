
export interface SessionValidationResult {
  valid: boolean;
  error?: string;
  username?: string;
  expiresAt?: string;
  token?: string;
  apiUrl?: string;
}

export interface SyncMetrics {
  totalVehicles: number;
  positionsUpdated: number;
  errors: number;
  lastSyncTime: Date;
}
