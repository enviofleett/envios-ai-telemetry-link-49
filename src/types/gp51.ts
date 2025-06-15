
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
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  statusText: string;
  isOnline: boolean;
  isMoving: boolean;
}
