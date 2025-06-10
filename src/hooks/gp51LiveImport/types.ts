
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

// Additional types needed by the existing hooks
export interface GP51Device {
  deviceid: string;
  devicename?: string;
  devicetype?: number;
  simnum?: string;
  simiccid?: string;
  createtime?: number;
  lastactivetime?: number;
  status?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface GP51Group {
  id: number;
  name: string;
  devices?: GP51Device[];
  [key: string]: any;
}

export interface GP51LiveData {
  users: GP51User[];
  devices: GP51Device[];
  groups: GP51Group[];
  statistics: {
    totalUsers: number;
    totalDevices: number;
    activeUsers: number;
    activeDevices: number;
  };
}

export interface GP51LiveImportConfig {
  importUsers: boolean;
  importDevices: boolean;
  userTypes: number[];
  deviceTypes: number[];
  dateRange: {
    from: Date;
    to: Date;
  };
  conflictResolution: 'update' | 'skip' | 'merge';
  selectedUserIds: string[];
  selectedDeviceIds: string[];
}

export interface GP51LiveImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedItems: number;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  errors: string[];
  startedAt: string;
  completedAt?: string;
  config: GP51LiveImportConfig;
}
