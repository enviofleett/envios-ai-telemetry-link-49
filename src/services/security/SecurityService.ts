import { createHash } from 'crypto';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export interface SecurityConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  enableAuditLogging: boolean;
  enableThreatDetection: boolean;
  credentialRotationInterval: number;
}

export interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'input_validation' | 'rate_limit' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
  timestamp: string;
}

export class SecurityService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static attemptTracking = new Map<string, { count: number; firstAttempt: number }>();
  private static securityEvents: SecurityEvent[] = [];
  private static config: SecurityConfig = {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    enableAuditLogging: true,
    enableThreatDetection: true,
    credentialRotationInterval: 24 * 60 * 60 * 1000 // 24 hours
  };

  // Enhanced input validation with context-aware rules
  static validateInput(
    input: string, 
    type: 'username' | 'email' | 'deviceId' | 'imei' | 'text' | 'gp51_token' | 'api_endpoint' | 'json_payload',
    context?: { operation?: string; userRole?: string }
  ): ValidationResult {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Input is required and must be a string' };
    }

    // Enhanced SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|JOIN)\b)/i,
      /(--|\#|\/\*|\*\/|;)/,
      /(\bOR\b.*=.*\bOR\b)/i,
      /(\bAND\b.*=.*\bAND\b)/i,
      /(\'|\";?|\b(UNION|JOIN)\b)/i,
      /(\bxp_cmdshell\b|\bsp_executesql\b)/i,
      /(\bhex\(|\bunhex\(|\bchar\()/i
    ];

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<img[^>]*src\s*=\s*["']javascript:/gi
    ];

    // Check for malicious patterns
    for (const pattern of [...sqlInjectionPatterns, ...xssPatterns]) {
      if (pattern.test(input)) {
        this.logSecurityEvent({
          type: 'input_validation',
          severity: 'high',
          description: `Malicious pattern detected in ${type} input`,
          additionalData: { inputType: type, pattern: pattern.source, context }
        });
        return { isValid: false, error: 'Invalid characters detected' };
      }
    }

    // Type-specific validation with enhanced rules
    const sanitizedValue = this.sanitizeInput(input, type);
    
    switch (type) {
      case 'username':
        if (input.length < 3 || input.length > 50) {
          return { isValid: false, error: 'Username must be 3-50 characters' };
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(input)) {
          return { isValid: false, error: 'Username contains invalid characters' };
        }
        break;
      
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input) || input.length > 254) {
          return { isValid: false, error: 'Invalid email format' };
        }
        break;
      
      case 'deviceId':
        if (input.length < 5 || input.length > 20) {
          return { isValid: false, error: 'Device ID must be 5-20 characters' };
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
          return { isValid: false, error: 'Device ID contains invalid characters' };
        }
        break;
      
      case 'imei':
        if (!/^\d{15}$/.test(input)) {
          return { isValid: false, error: 'IMEI must be exactly 15 digits' };
        }
        if (!this.validateLuhnAlgorithm(input)) {
          return { isValid: false, error: 'Invalid IMEI checksum' };
        }
        break;

      case 'gp51_token':
        if (input.length < 10 || input.length > 500) {
          return { isValid: false, error: 'Invalid GP51 token format' };
        }
        if (!/^[a-zA-Z0-9+/=_-]+$/.test(input)) {
          return { isValid: false, error: 'GP51 token contains invalid characters' };
        }
        break;

      case 'api_endpoint':
        try {
          const url = new URL(input);
          if (!['http:', 'https:'].includes(url.protocol)) {
            return { isValid: false, error: 'Invalid protocol' };
          }
        } catch {
          return { isValid: false, error: 'Invalid URL format' };
        }
        break;

      case 'json_payload':
        try {
          JSON.parse(input);
        } catch {
          return { isValid: false, error: 'Invalid JSON format' };
        }
        break;
      
      case 'text':
        if (input.length > 2000) {
          return { isValid: false, error: 'Text input too long (max 2000 characters)' };
        }
        break;
    }

    return { isValid: true, sanitizedValue };
  }

  // Enhanced rate limiting with distributed support
  static checkRateLimit(
    identifier: string, 
    tier: 'ip' | 'user' | 'endpoint' = 'ip'
  ): { allowed: boolean; remainingAttempts?: number; resetTime?: Date } {
    const now = Date.now();
    const key = `${tier}:${identifier}`;
    const tracking = this.attemptTracking.get(key);

    if (!tracking) {
      this.attemptTracking.set(key, { count: 1, firstAttempt: now });
      return { 
        allowed: true, 
        remainingAttempts: this.MAX_ATTEMPTS - 1,
        resetTime: new Date(now + this.ATTEMPT_WINDOW)
      };
    }

    // Reset if window has passed
    if (now - tracking.firstAttempt > this.ATTEMPT_WINDOW) {
      this.attemptTracking.set(key, { count: 1, firstAttempt: now });
      return { 
        allowed: true, 
        remainingAttempts: this.MAX_ATTEMPTS - 1,
        resetTime: new Date(now + this.ATTEMPT_WINDOW)
      };
    }

    // Check if exceeded limit
    if (tracking.count >= this.MAX_ATTEMPTS) {
      this.logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        description: `Rate limit exceeded for ${tier}`,
        additionalData: { identifier, tier, attempts: tracking.count }
      });
      
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: new Date(tracking.firstAttempt + this.ATTEMPT_WINDOW)
      };
    }

    // Increment and allow
    tracking.count++;
    return { 
      allowed: true, 
      remainingAttempts: this.MAX_ATTEMPTS - tracking.count,
      resetTime: new Date(tracking.firstAttempt + this.ATTEMPT_WINDOW)
    };
  }

  // Secure credential management
  static async secureHash(password: string, salt?: string): Promise<string> {
    const saltBytes = salt ? 
      new TextEncoder().encode(salt) : 
      crypto.getRandomValues(new Uint8Array(32));
    
    const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const encoder = new TextEncoder();
    const data = encoder.encode(password + saltHex);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return `${saltHex}:${hashHex}`;
  }

  static async verifyHash(password: string, storedHash: string): Promise<boolean> {
    try {
      const [salt, hash] = storedHash.split(':');
      if (!salt || !hash) return false;
      
      const computedHash = await this.secureHash(password, salt);
      const [, computedHashPart] = computedHash.split(':');
      
      return computedHashPart === hash;
    } catch {
      return false;
    }
  }

  // Security event logging
  static logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 1000 events to prevent memory issues
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Log to console for immediate visibility
    console.log(`[SECURITY] ${event.type} - ${event.severity}: ${event.description}`, event.additionalData);

    // Trigger alerts for critical events
    if (event.severity === 'critical') {
      this.triggerSecurityAlert(securityEvent);
    }
  }

  // Get recent security events
  static getSecurityEvents(filters?: {
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    hours?: number;
    limit?: number;
  }): SecurityEvent[] {
    let events = [...this.securityEvents];

    if (filters?.type) {
      events = events.filter(e => e.type === filters.type);
    }

    if (filters?.severity) {
      events = events.filter(e => e.severity === filters.severity);
    }

    if (filters?.hours) {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - filters.hours);
      events = events.filter(e => new Date(e.timestamp) >= cutoff);
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters?.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }

  // Input sanitization
  private static sanitizeInput(input: string, type: string): string {
    // Basic HTML entity encoding
    let sanitized = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    // Type-specific sanitization
    switch (type) {
      case 'username':
      case 'deviceId':
        sanitized = sanitized.replace(/[^a-zA-Z0-9_.-]/g, '');
        break;
      case 'text':
        sanitized = sanitized.replace(/[<>]/g, '');
        break;
    }

    return sanitized.trim();
  }

  // IMEI Luhn algorithm validation
  private static validateLuhnAlgorithm(imei: string): boolean {
    let sum = 0;
    let alternate = false;
    
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

  // Security alert system
  private static triggerSecurityAlert(event: SecurityEvent): void {
    // In production, this would integrate with alerting systems
    console.error(`[CRITICAL SECURITY ALERT] ${event.description}`, event);
    
    // Example: Send to monitoring service, email, Slack, etc.
    // await notificationService.sendCriticalAlert(event);
  }

  // Authorization check with enhanced role-based permissions
  static hasPermission(
    userRole: string, 
    requiredPermission: string,
    context?: { resourceId?: string; operation?: string }
  ): boolean {
    const rolePermissions = {
      'admin': [
        'create_user', 'delete_user', 'manage_vehicles', 'view_all', 
        'manage_system', 'access_audit_logs', 'manage_security_config'
      ],
      'manager': [
        'create_user', 'manage_vehicles', 'view_all', 'view_audit_logs'
      ],
      'user': [
        'view_own', 'manage_own_vehicles', 'update_own_profile'
      ],
      'viewer': ['view_own']
    };

    const permissions = rolePermissions[userRole as keyof typeof rolePermissions] || [];
    
    // Log authorization attempts
    SecurityService.logSecurityEvent({
      type: 'authorization',
      severity: 'low',
      description: `Authorization check: ${userRole} requesting ${requiredPermission}`,
      additionalData: { userRole, requiredPermission, context, granted: permissions.includes(requiredPermission) }
    });

    return permissions.includes(requiredPermission);
  }

  // Security configuration management
  static updateSecurityConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.logSecurityEvent({
      type: 'authentication',
      severity: 'medium',
      description: 'Security configuration updated',
      additionalData: { changes: newConfig }
    });
  }

  static getSecurityConfig(): SecurityConfig {
    return { ...this.config };
  }
}
