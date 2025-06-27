
// Supabase-specific GP51 type definitions

export interface GP51SessionRow {
  id: string;
  user_id: string;
  gp51_token: string;
  gp51_username: string;
  created_at: string;
  expires_at: string;
  updated_at: string;
  last_activity_at: string | null;
  is_active: boolean;
  session_fingerprint: string | null;
}

export interface GP51DeviceRow {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  device_type: number | null;
  group_id: number | null;
  group_name: string | null;
  is_free: number | null;
  last_active_time: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  raw_data: any;
}

export interface GP51PositionRow {
  id: string;
  user_id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude: number;
  device_time: string;
  server_time: string | null;
  status: number | null;
  moving: number | null;
  gps_source: string | null;
  battery: number | null;
  signal: number | null;
  satellites: number | null;
  created_at: string;
  raw_data: any;
}

export interface GP51AuthResponse {
  status: number;
  cause: string;
  success: boolean;
  error?: string;
  token?: string;
  expiresAt?: string;
}

export interface GP51Session {
  id: string;
  user_id: string;
  gp51_username: string;
  gp51_token: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}
