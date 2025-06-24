
export interface GP51ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GP51Device {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  groupId: string;
  isOnline: boolean;
  lastUpdate?: Date;
}

export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName?: string;
  latitude: number;
  longitude: number;
  speed: number; // Required, not optional
  course: number;
  timestamp: Date;
  status?: number;
  statusText: string;
  isOnline: boolean;
  isMoving: boolean;
}

export interface VehicleGP51Metadata {
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  status?: number;
  statusText?: string;
  timestamp?: string;
  isMoving?: boolean;
  vehicleStatus?: 'online' | 'offline' | 'inactive' | 'idle' | 'moving';
  lastGP51Sync?: string;
  importSource?: string;
  imei?: string;
  [key: string]: any;
}

export interface GP51DeviceData {
  deviceId: string;
  deviceName: string;
  deviceType?: string;
  simNumber?: string;
  groupId?: string;
  groupName?: string;
  isActive: boolean;
  lastActiveTime?: number;
}

export interface GP51TelemetryData {
  deviceId: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  status: string;
}

export interface GP51LiveVehiclesResponseData {
  devices: GP51DeviceData[];
  telemetry: GP51TelemetryData[];
  metadata?: {
    totalDevices: number;
    activeDevices: number;
    lastSync: string;
  };
}

export interface GP51LiveVehiclesResponse {
  success: boolean;
  error?: string;
  data: GP51LiveVehiclesResponseData;
}

export interface GP51ProcessResult {
  created: number;
  errors: number;
  errorDetails?: { itemId: string; message: string }[];
}
