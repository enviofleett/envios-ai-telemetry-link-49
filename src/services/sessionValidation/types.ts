
export interface EnhancedSessionResult {
  valid: boolean;
  error?: string;
  username?: string;
  expiresAt?: string;
  token?: string;
  healthStatus: 'healthy' | 'degraded' | 'critical';
  lastValidated: Date;
}

export interface SessionCache {
  result: EnhancedSessionResult | null;
  lastValidation: Date | null;
}
