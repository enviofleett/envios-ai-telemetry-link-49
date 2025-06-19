import { z } from 'zod';

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'rate_limit_exceeded' | 'invalid_input' | 'authentication_success' | 'authentication_failure' | 'permission_denied' | 'suspicious_activity' | 'rate_limit' | 'authentication' | 'input_validation' | 'authorization';
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  details?: Record<string, any>; // Made optional
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  additionalData?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: string;
  sanitizedValue?: string; // Alias for backward compatibility
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests?: number;
  resetTime?: number;
}

export class SecurityService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static attemptTracking = new Map<string, { count: number; firstAttempt: number }>();
  private static securityEvents: SecurityEvent[] = [];

  // Input validation with SQL injection protection
  static validateInput(input: string, type: 'username' | 'email' | 'deviceId' | 'imei' | 'text' | 'password'): ValidationResult {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Input is required and must be a string' };
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

    // Sanitize input
    const sanitized = input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .slice(0, 1000); // Limit length

    // Type-specific validation
    switch (type) {
      case 'username':
        if (sanitized.length < 3 || sanitized.length > 50) {
          return { isValid: false, error: 'Username must be 3-50 characters' };
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
          return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitized) || sanitized.length > 254) {
          return { isValid: false, error: 'Invalid email format' };
        }
        break;
      
      case 'deviceId':
        if (sanitized.length < 5 || sanitized.length > 20) {
          return { isValid: false, error: 'Device ID must be 5-20 characters' };
        }
        if (!/^[a-zA-Z0-9]+$/.test(sanitized)) {
          return { isValid: false, error: 'Device ID can only contain alphanumeric characters' };
        }
        break;
      
      case 'imei':
        if (!/^\d{15}$/.test(sanitized)) {
          return { isValid: false, error: 'IMEI must be exactly 15 digits' };
        }
        // Luhn algorithm validation for IMEI
        if (!this.validateLuhnAlgorithm(sanitized)) {
          return { isValid: false, error: 'Invalid IMEI checksum' };
        }
        break;

      case 'password':
        if (sanitized.length < 6 || sanitized.length > 128) {
          return { isValid: false, error: 'Password must be 6-128 characters' };
        }
        break;
      
      case 'text':
        if (sanitized.length > 1000) {
          return { isValid: false, error: 'Text input too long (max 1000 characters)' };
        }
        break;
    }

    return { 
      isValid: true, 
      sanitized,
      sanitizedValue: sanitized // Alias for backward compatibility
    };
  }

  // Rate limiting implementation
  static checkRateLimit(identifier: string, context?: string): RateLimitResult {
    const now = Date.now();
    const tracking = this.attemptTracking.get(identifier);

    if (!tracking) {
      this.attemptTracking.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, remainingRequests: this.MAX_ATTEMPTS - 1, resetTime: now + this.ATTEMPT_WINDOW };
    }

    // Reset if window has passed
    if (now - tracking.firstAttempt > this.ATTEMPT_WINDOW) {
      this.attemptTracking.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, remainingRequests: this.MAX_ATTEMPTS - 1, resetTime: now + this.ATTEMPT_WINDOW };
    }

    // Check if exceeded limit
    if (tracking.count >= this.MAX_ATTEMPTS) {
      return { 
        allowed: false, 
        remainingRequests: 0,
        resetTime: tracking.firstAttempt + this.ATTEMPT_WINDOW
      };
    }

    // Increment and allow
    tracking.count++;
    return { 
      allowed: true, 
      remainingRequests: this.MAX_ATTEMPTS - tracking.count,
      resetTime: tracking.firstAttempt + this.ATTEMPT_WINDOW
    };
  }

  // Security event logging
  static logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...event
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Log to console for monitoring
    console.warn('🔒 Security Event:', {
      type: securityEvent.type,
      severity: securityEvent.severity,
      details: securityEvent.details,
      timestamp: new Date(securityEvent.timestamp).toISOString()
    });
  }

  // Get security events
  static getSecurityEvents(options: { hours?: number; limit?: number } = {}): SecurityEvent[] {
    const { hours = 24, limit = 100 } = options;
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    
    return this.securityEvents
      .filter(event => event.timestamp > cutoffTime)
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Authorization check helper
  static hasPermission(userRole: string, requiredPermission: string): boolean {
    const rolePermissions = {
      'admin': ['create_user', 'delete_user', 'manage_vehicles', 'view_all', 'manage_system'],
      'manager': ['create_user', 'manage_vehicles', 'view_all'],
      'user': ['view_own', 'manage_own_vehicles'],
      'viewer': ['view_own']
    };

    return rolePermissions[userRole as keyof typeof rolePermissions]?.includes(requiredPermission) || false;
  }

  // IMEI Luhn algorithm validation
  private static validateLuhnAlgorithm(imei: string): boolean {
    let sum = 0;
    let alternate = false;
    
    // Process digits from right to left
    for (let i = imei.length - 1; i >= 0; i--) {
      let digit = parseInt(imei.charAt(i));
      
      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit = (digit % 10) + 1;
        }
      }
      
      sum += digit;
      alternate = !alternate;
    }
    
    return (sum % 10) === 0;
  }

  // Clear security events (for testing/maintenance)
  static clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  // Get rate limit status
  static getRateLimitStatus(identifier: string): { count: number; resetTime: number } | null {
    const tracking = this.attemptTracking.get(identifier);
    if (!tracking) return null;
    
    return {
      count: tracking.count,
      resetTime: tracking.firstAttempt + this.ATTEMPT_WINDOW
    };
  }
}
