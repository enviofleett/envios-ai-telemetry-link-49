
export interface SettingsRequest {
  action: string;
  username?: string;
  password?: string;
  apiUrl?: string;
  testOnly?: boolean;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  username?: string;
  password?: string;
  hashedPassword?: string;
  apiUrl?: string;
  method?: string;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  importedVehicles?: number;
  message?: string;
}

export interface SessionData {
  username: string;
  expiresAt: string;
  method?: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  session?: SessionData;
  importResult?: ImportResult;
  importError?: string;
  error?: string;
  details?: string;
  latency?: number;
  connected?: boolean;
  username?: string;
  apiUrl?: string;
  lastValidated?: string;
  isExpired?: boolean;
}
