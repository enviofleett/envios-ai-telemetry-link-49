
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

export interface GP51LiveData {
  users: any[];
  devices: any[];
  vehicles: any[];
  telemetry: any[];
  total_devices: number;
  total_positions: number;
  fetched_at: string;
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
