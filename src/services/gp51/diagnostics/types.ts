
export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface GP51SessionData {
  gp51_token: string;
  token_expires_at: string;
  username: string;
}

export interface VehicleRecord {
  device_id: string;
  last_position: Record<string, any> | null;
  updated_at: string;
}

export interface DiagnosticTestOptions {
  timestamp: string;
}
