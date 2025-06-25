
export interface GPS51Device {
  id: string;
  device_id: string;
  device_name: string;
  group_id?: string;
  device_type?: string;
  sim_number?: string;
  login_name?: string;
  creator?: string;
  status_code?: number;
  status_text?: string;
  last_active_time?: string;
  is_active: boolean;
  is_expired: boolean;
  days_since_active?: number;
  created_at: string;
  updated_at: string;
  last_sync: string;
  gps51_groups?: {
    group_name: string;
  };
}

export interface GPS51Group {
  id: string;
  group_id: string;
  group_name: string;
  remark?: string;
  device_count: number;
  created_at: string;
  updated_at: string;
  last_sync: string;
}

export interface GPS51User {
  id: string;
  username: string;
  display_name?: string;
  user_type?: number;
  user_type_text?: string;
  company_name?: string;
  email?: string;
  phone?: string;
  device_count: number;
  created_at: string;
  updated_at: string;
  last_sync: string;
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
  expired_devices: number;
  total_groups: number;
  total_users: number;
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
