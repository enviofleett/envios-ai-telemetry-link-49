
export interface GP51ConnectionStatus {
  connected: boolean;
  username?: string;
  apiUrl?: string;
  error?: string;
  lastCheck: string;
  deviceCount?: number;
  lastDataFetch?: string;
  realTimeStatus?: 'online' | 'offline' | 'error';
}

export interface GP51User {
  username: string;
  usertype: number;
  deviceids: string[];
  email?: string;
  showname?: string;
  phone?: string; // Added missing field
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: string;
  isfree: boolean;
  simNumber?: string;
  simnum?: string; // Added missing field (alternative naming)
  activated?: boolean;
}

export interface GP51Group {
  id: string;
  name: string;
  deviceCount: number;
  devices?: GP51Device[];
}

export interface GP51Statistics {
  totalUsers: number;
  activeUsers: number;
  totalDevices: number;
  activeDevices: number;
}

export interface GP51LiveData {
  users: GP51User[];
  devices: GP51Device[];
  groups?: GP51Group[];
  vehicles?: any[];
  telemetry?: any[];
  total_devices?: number;
  total_positions?: number;
  fetched_at?: string;
  statistics: GP51Statistics;
}

export interface GP51LiveImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  processedItems: number;
  successfulItems: number;
  totalItems: number;
  errors?: string[];
  
  // Added missing fields
  failedItems: number;
  progress: number;
  results: {
    users: {
      created: number;
      updated: number;
      failed: number;
    };
    devices: {
      created: number;
      updated: number;
      failed: number;
    };
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
  conflictResolution: 'skip' | 'update' | 'create_new';
  selectedUserIds: string[];
  selectedDeviceIds: string[];
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
  altitude?: number;
  alarm_status?: string;
  signal_strength?: number;
}
