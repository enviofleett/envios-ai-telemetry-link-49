
export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface DiagnosticTestOptions {
  timestamp: string;
}

// Flat return types for queries - using string instead of uuid
export interface GP51Session {
  id: string;
  envio_user_id: string | null;
  gp51_username: string;
  gp51_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleSample {
  id: string;
  device_id: string;
  device_name: string | null;
  last_position: Record<string, any> | null;
  updated_at: string;
  created_at: string;
  owner_id: string | null;
  is_active: boolean;
}

export interface VehicleUpdate {
  id: string;
  device_id: string;
  device_name: string | null;
  last_position: Record<string, any> | null;
  updated_at: string;
  owner_id: string | null;
}

export interface Gp51Token {
  id: string;
  envio_user_id: string | null;
  gp51_username: string;
  gp51_token: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  created_at: string;
}
