
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
  speed: number;
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
  vehicleStatus?: 'online' | 'offline';
  lastGP51Sync?: string;
  importSource?: string;
  imei?: string;
}
