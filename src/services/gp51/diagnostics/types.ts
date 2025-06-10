
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

// Simplified return types for queries - using string instead of uuid
export interface GP51Session {
  id: string;
  status: string;
  created_at: string;
  user_id: string;
}

export interface VehicleSample {
  id: string;
  vehicle_id: string;
  sample_data: string;
  recorded_at: string;
}

export interface VehicleUpdate {
  id: string;
  vehicle_id: string;
  update_details: string;
  updated_at: string;
}

export interface Gp51Token {
  id: string;
  token: string;
  created_at: string;
  expires_at: string;
}
