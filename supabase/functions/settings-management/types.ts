
export interface SettingsRequest {
  action: string;
  username?: string;
  password?: string;
  apiUrl?: string;
  testOnly?: boolean;
}

export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: {
    environment: boolean;
    database: boolean;
    gp51_auth: boolean;
  };
  error?: string;
}
