
export interface SettingsRequest {
  action: string;
  username?: string;
  password?: string;
  apiUrl?: string;
  [key: string]: any;
}

export interface GP51AuthResult {
  success: boolean;
  error?: string;
  token?: string;
  message?: string;
  status?: number;
}

export interface SessionCleanupResult {
  cleaned: number;
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high';
}
