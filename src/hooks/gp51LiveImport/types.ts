
export interface GP51ConnectionStatus {
  connected: boolean;
  username?: string;
  apiUrl?: string;
  error?: string;
  lastCheck: string;
  deviceCount?: number;
}

export interface GP51PreviewData {
  users: GP51User[];
  vehicles: GP51Vehicle[];
  conflicts: GP51ImportConflict[];
}

export interface GP51User {
  id: string;
  username: string;
  name?: string;
  email?: string;
  phone?: string;
  userType?: number;
  groupId?: number;
}

export interface GP51Vehicle {
  id: string;
  deviceId: string;
  name?: string;
  plateNumber?: string;
  deviceType?: string;
  groupId?: number;
  status?: string;
  lastUpdate?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
}

export interface GP51ImportConflict {
  type: 'user_exists' | 'vehicle_exists' | 'duplicate_device';
  message: string;
  existingRecord?: any;
  incomingRecord?: any;
}

export interface LiveVehicleTelemetry {
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string;
  status: string;
  odometer?: number;
  fuel_level?: number;
  engine_status?: string;
}
