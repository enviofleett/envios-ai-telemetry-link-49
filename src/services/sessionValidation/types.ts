
export interface EnhancedSessionResult {
  valid: boolean;
  error?: string;
  username?: string;
  expiresAt?: string;
  token?: string;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  lastValidated: Date;
}

export interface SessionValidationResult {
  valid: boolean;
  error?: string;
  username?: string;
  expiresAt?: string;
  token?: string;
  session?: any;
}

export interface SessionCache {
  result: EnhancedSessionResult | null;
  lastValidation: Date | null;
}

export interface SessionHealth {
  status: 'healthy' | 'degraded' | 'critical';
  isValid: boolean;
  expiresAt: Date | null;
  username: string | null;
  lastCheck: Date;
  consecutiveFailures: number;
  isAuthError: boolean;
  latency: number | null;
  needsRefresh: boolean;
  errorMessage?: string;
}
