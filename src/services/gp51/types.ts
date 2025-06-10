
export interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

export interface GP51Session {
  gp51_token: string;
  token_expires_at: string;
  username: string;
}

export interface VehicleData {
  device_id: string;
  last_position: any;
  updated_at: string;
}
