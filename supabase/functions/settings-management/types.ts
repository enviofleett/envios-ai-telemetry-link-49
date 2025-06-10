
export interface SettingsRequest {
  action: string;
  username?: string;
  password?: string;
  apiUrl?: string;
  testOnly?: boolean;
}

export interface GP51AuthResult {
  success: boolean;
  token?: string;
  username?: string;
  apiUrl?: string;
  error?: string;
  details?: string;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: string;
  suggestions?: string[];
  category?: string;
  severity?: string;
}
