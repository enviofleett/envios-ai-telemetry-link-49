
export interface GPS51Device {
  id: string;
  device_id: string;
  device_name: string;
  group_id: number;
  device_type: number;
  device_tag: string;
  car_tag_color: number | null;
  sim_number: string | null;
  login_name: string | null;
  creator: string;
  status_code?: number | null; // Optional as it may not exist in DB
  status_text?: string | null; // Optional as it may not exist in DB
  last_active_time: number | null;
  overdue_time: number | null;
  expire_notify_time: number;
  allow_edit: number; // This is a number in DB, not boolean
  starred: number | null; // This is a number in DB (0/1), not boolean
  icon: number | null;
  remark: string | null;
  video_channel_count: number | null;
  is_active: boolean;
  days_since_active?: number | null; // Computed field
  create_time: number | null;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
  gps51_groups?: {
    group_name: string;
  };
}

export interface GPS51Group {
  id: string;
  group_id: number;
  group_name: string;
  remark: string | null;
  device_count: number | null;
  is_active: boolean | null;
  shared: number | null;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
}

export interface GPS51User {
  id: string;
  envio_user_id: string;
  gp51_username: string;
  nickname: string;
  company_name: string;
  email: string;
  phone: string;
  qq: string;
  wechat: string;
  multi_login: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_sync_at: string | null;
}

export interface GPS51Position {
  id: string;
  device_id: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  update_time?: string;
  moving: boolean;
  address?: string;
  created_at: string;
}

export interface GPS51DashboardSummary {
  total_devices: number;
  active_devices: number;
  total_groups: number;
  devices_with_positions: number;
  total_users?: number;
}

export interface GPS51DataResponse {
  success: boolean;
  data?: {
    groups: GPS51Group[];
    devices: GPS51Device[];
    users: GPS51User[];
    summary: GPS51DashboardSummary;
  };
  error?: string;
}

export interface GPS51TestResult {
  name: string;
  success: boolean;
  data: number;
  error?: string;
}

// Missing types that were causing TypeScript errors
export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  timestamp: Date;
  statusText: string;
  isOnline: boolean;
  isMoving: boolean;
  status: number;
}

export interface GP51DeviceData {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  simNumber?: string;
  groupId?: string;
  groupName?: string;
  isActive: boolean;
  lastActiveTime?: string;
}

export interface GP51LiveVehiclesResponse {
  success: boolean;
  data: {
    devices: GP51DeviceData[];
    telemetry: GP51TelemetryData[];
    metadata?: {
      totalDevices: number;
      activeDevices: number;
      lastSync: string;
    };
  };
  error?: string;
}

export interface GP51ProcessResult {
  created: number;
  errors: number;
  errorDetails: { itemId: string; message: string }[];
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

export interface VehicleGP51Metadata {
  lastSync: string;
  deviceStatus: string;
  signalStrength?: number;
  batteryLevel?: number;
}
