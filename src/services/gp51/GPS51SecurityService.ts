export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

export interface SecurityEvent {
  timestamp: Date;
  type: 'login_attempt' | 'login_failed' | 'account_locked' | 'rate_limit_exceeded';
  identifier: string;
  details?: any;
}

export class GPS51SecurityService {
  private static readonly DEFAULT_CONFIG: RateLimitConfig = {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000 // 15 minutes
  };

  private static attemptTracking = new Map<string, { count: number; firstAttempt: number; locked: boolean }>();
  private static securityEvents: SecurityEvent[] = [];

  /**
   * Check if requests are within rate limits
   */
  static checkRateLimit(identifier: string, config: RateLimitConfig = this.DEFAULT_CONFIG): { 
    allowed: boolean; 
    remainingAttempts: number;
    resetTime?: Date;
  } {
    const now = Date.now();
    const tracking = this.attemptTracking.get(identifier);

    if (!tracking) {
      this.attemptTracking.set(identifier, { count: 1, firstAttempt: now, locked: false });
      return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
    }

    // Reset if window has passed
    if (now - tracking.firstAttempt > config.windowMs) {
      this.attemptTracking.set(identifier, { count: 1, firstAttempt: now, locked: false });
      return { allowed: true, remainingAttempts: config.maxAttempts - 1 };
    }

    // Check if account is locked
    if (tracking.locked) {
      const resetTime = new Date(tracking.firstAttempt + config.windowMs);
      return { allowed: false, remainingAttempts: 0, resetTime };
    }

    // Check if exceeded limit
    if (tracking.count >= config.maxAttempts) {
      tracking.locked = true;
      this.logSecurityEvent('account_locked', identifier, { attempts: tracking.count });
      const resetTime = new Date(tracking.firstAttempt + config.windowMs);
      return { allowed: false, remainingAttempts: 0, resetTime };
    }

    // Increment and allow
    tracking.count++;
    return { allowed: true, remainingAttempts: config.maxAttempts - tracking.count };
  }

  /**
   * Record a failed authentication attempt
   */
  static recordFailedAttempt(identifier: string): void {
    this.logSecurityEvent('login_failed', identifier);
    
    // This will be handled by checkRateLimit, but we can add additional logic here
    const tracking = this.attemptTracking.get(identifier);
    if (tracking && tracking.count >= this.DEFAULT_CONFIG.maxAttempts - 1) {
      this.logSecurityEvent('rate_limit_exceeded', identifier, { attempts: tracking.count + 1 });
    }
  }

  /**
   * Record a successful authentication
   */
  static recordSuccessfulAttempt(identifier: string): void {
    // Clear failed attempts on successful login
    this.attemptTracking.delete(identifier);
    this.logSecurityEvent('login_attempt', identifier, { success: true });
  }

  /**
   * Check if account is currently locked
   */
  static isAccountLocked(identifier: string): boolean {
    const tracking = this.attemptTracking.get(identifier);
    return tracking?.locked || false;
  }

  /**
   * Get remaining lockout time
   */
  static getLockoutTimeRemaining(identifier: string): number {
    const tracking = this.attemptTracking.get(identifier);
    if (!tracking || !tracking.locked) return 0;

    const unlockTime = tracking.firstAttempt + this.DEFAULT_CONFIG.windowMs;
    const remaining = unlockTime - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Log security events
   */
  private static logSecurityEvent(type: SecurityEvent['type'], identifier: string, details?: any): void {
    const event: SecurityEvent = {
      timestamp: new Date(),
      type,
      identifier,
      details
    };

    this.securityEvents.push(event);
    
    // Keep only last 100 events
    if (this.securityEvents.length > 100) {
      this.securityEvents.shift();
    }

    console.log(`🔒 Security Event: ${type} for ${identifier}`, details || '');
  }

  /**
   * Get recent security events
   */
  static getSecurityEvents(limit: number = 20): SecurityEvent[] {
    return this.securityEvents
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Get security statistics
   */
  static getSecurityStats() {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const recentEvents = this.securityEvents.filter(e => e.timestamp.getTime() > oneHourAgo);
    const lockedAccounts = Array.from(this.attemptTracking.entries())
      .filter(([_, tracking]) => tracking.locked)
      .length;

    return {
      recentFailedAttempts: recentEvents.filter(e => e.type === 'login_failed').length,
      rateLimitExceeded: recentEvents.filter(e => e.type === 'rate_limit_exceeded').length,
      lockedAccounts,
      totalEvents: this.securityEvents.length,
      lastEventTime: this.securityEvents.length > 0 ? this.securityEvents[this.securityEvents.length - 1].timestamp : null
    };
  }

  /**
   * Validate input to prevent injection attacks
   */
  static validateInput(input: string, type: 'username' | 'password' | 'general'): { isValid: boolean; error?: string } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Input must be a non-empty string' };
    }

    // Basic SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\bOR\b.*=.*\bOR\b)/i,
      /(\bAND\b.*=.*\bAND\b)/i,
      /(\'|\";?|(\b(UNION|JOIN)\b))/i
    ];

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(input)) {
        return { isValid: false, error: 'Invalid characters detected' };
      }
    }

    // Type-specific validation
    switch (type) {
      case 'username':
        if (input.length < 3 || input.length > 50) {
          return { isValid: false, error: 'Username must be 3-50 characters' };
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
          return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
        }
        break;
      
      case 'password':
        if (input.length < 1 || input.length > 1000) {
          return { isValid: false, error: 'Password must be 1-1000 characters' };
        }
        break;
      
      case 'general':
        if (input.length > 1000) {
          return { isValid: false, error: 'Input too long (max 1000 characters)' };
        }
        break;
    }

    return { isValid: true };
  }
}
