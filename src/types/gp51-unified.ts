
// Unified GP51 Type Definitions - Single Source of Truth
export interface GP51TestResult {
  name: string;
  success: boolean;
  message: string;
  responseTime: number;
  timestamp: Date;
  data?: any;
  error?: string;
  details?: string;
}

export interface GP51DeviceData {
  deviceId: string;
  deviceName: string;
  deviceType?: string;
  simNumber?: string;
  groupId?: string;
  groupName?: string;
  isActive: boolean;
  lastActiveTime?: string | Date;
}

export interface GP51ProcessResult {
  success: boolean;
  created: number;
  errors: number;
  processed: number;
  skipped: number;
  details: string[];
  timestamp: Date;
}

export interface GP51TelemetryData {
  deviceId: string;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  status?: string;
}

export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  status: string;
  isMoving: boolean;
  statusText?: string;
}

export interface GP51LiveVehiclesResponse {
  success?: boolean;
  vehicles: GP51DeviceData[];
  metadata?: {
    totalDevices: number;
    activeDevices: number;
    lastSync: string;
  };
  lastUpdate: Date;
  totalCount: number;
  activeCount: number;
  error?: string;
}

export interface GP51Group {
  id: string;
  group_name: string;
  group_id: number;
  device_count: number;
  last_sync_at: Date | string;
  remark?: string;
  devices?: GP51DeviceData[];
  // Alternative naming support
  groupid?: number;
  groupname?: string;
}

export interface GP51AuthResponse {
  success: boolean;
  status: string;
  cause?: string;
  error?: string;
  token?: string;
  username?: string;
  expiresAt?: string;
}

export interface GP51Position {
  deviceId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number;
  course: number;
  status: string;
  isMoving: boolean;
  statusText?: string;
  address?: string;
}

export interface GP51ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  status?: string;
  groups?: GP51Group[];
  error?: string;
  cause?: string;
}

export interface GP51HealthStatus {
  status: 'healthy' | 'degraded' | 'failed';
  lastCheck: Date;
  responseTime?: number;
  errors?: string[];
}

// Legacy aliases for backward compatibility
export type GPS51TestResult = GP51TestResult;
export type GPS51Device = GP51DeviceData;
export type GPS51Group = GP51Group;
export type GPS51Position = GP51Position;
