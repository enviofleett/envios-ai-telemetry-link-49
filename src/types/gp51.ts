
// Core GP51 Types
export interface GP51AuthResponse {
  status: number;
  cause: string;
  token?: string;
  expires_at?: string;
}

export interface GP51HealthStatus {
  isConnected: boolean;
  lastPingTime: Date;
  responseTime: number;
  tokenValid: boolean;
  sessionValid: boolean;
  activeDevices: number;
  errors: string[];
  lastCheck: Date;
  errorMessage?: string;
}

export interface GP51Session {
  username: string;
  token: string;
  isConnected: boolean;
  expiresAt: Date;
  lastActivity: Date;
}

export interface GP51MonitorListResponse {
  status: number;
  cause: string;
  groups: GP51Group[];
}

export interface GP51User {
  username: string;
  usertype: number;
  showname: string;
  companyname?: string;
  email?: string;
  phone?: string;
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  devices: GP51Device[];
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: string;
  lastactivetime: number;
  simnum?: string;
}

export interface GP51Position {
  deviceid: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: number;
  status: number;
  moving?: number;
  address?: string;
}

export interface GP51ProcessedPosition {
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  status: number;
  statusText: string;
  isMoving: boolean;
  address?: string;
}

// Export additional types that may be needed
export interface GP51Config {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  defaultTimezone: number;
}

export interface GP51SyncResult {
  success: boolean;
  processed: number;
  errors: string[];
  timestamp: Date;
}
