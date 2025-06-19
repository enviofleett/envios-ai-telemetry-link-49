
import { z } from 'zod';

// Enhanced security service with comprehensive validation and protection
export class SecurityService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static readonly SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
  private static attemptTracking = new Map<string, { count: number; firstAttempt: number; blocked: boolean }>();

  // Secure password hashing using Web Crypto API
  static async secureHash(password: string): Promise<string> {
    try {
      // Generate random salt
      const salt = crypto.getRandomValues(new Uint8Array(32));
      const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Hash password with salt using PBKDF2
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password + saltHex);
      
      const key = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        256
      );
      
      const hashArray = Array.from(new Uint8Array(derivedBits));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return `pbkdf2:100000:${saltHex}:${hashHex}`;
    } catch (error) {
      console.error('Secure hashing failed:', error);
      throw new Error('Password hashing failed');
    }
  }

  static async verifyHash(password: string, storedHash: string): Promise<boolean> {
    try {
      const parts = storedHash.split(':');
      if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
        return false;
      }
      
      const [, iterations, saltHex, hashHex] = parts;
      const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
      
      const encoder = new TextEncoder();
      const passwordData = encoder.encode(password + saltHex);
      
      const key = await crypto.subtle.importKey(
        'raw',
        passwordData,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
      );
      
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: parseInt(iterations),
          hash: 'SHA-256'
        },
        key,
        256
      );
      
      const hashArray = Array.from(new Uint8Array(derivedBits));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return computedHash === hashHex;
    } catch (error) {
      console.error('Hash verification failed:', error);
      return false;
    }
  }

  // Enhanced input validation with comprehensive security checks
  static validateInput(input: string, type: 'username' | 'email' | 'deviceId' | 'imei' | 'text' | 'password'): { isValid: boolean; error?: string; sanitized?: string } {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Input is required and must be a string' };
    }

    // Remove potentially dangerous characters
    const sanitized = input
      .trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/data:/gi, '') // Remove data: protocol
      .slice(0, 1000); // Limit length

    // Advanced SQL injection patterns
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|JOIN)\b)/i,
      /(--|\#|\/\*|\*\/|;)/,
      /(\bOR\b.*=.*\bOR\b)/i,
      /(\bAND\b.*=.*\bAND\b)/i,
      /(\'|\";?)/,
      /(\bxp_|sp_|fn_)/i, // SQL Server system procedures
      /(\binformation_schema|mysql|pg_|sys\.)/i, // Database system tables
    ];

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(sanitized)) {
        return { isValid: false, error: 'Invalid characters detected' };
      }
    }

    // XSS prevention patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /onload=/gi,
      /onerror=/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(sanitized)) {
        return { isValid: false, error: 'Potentially unsafe content detected' };
      }
    }

    // Type-specific validation with Zod schemas
    try {
      switch (type) {
        case 'username':
          z.string().min(3).max(50).regex(/^[a-zA-Z0-9_-]+$/).parse(sanitized);
          break;
        
        case 'email':
          z.string().email().max(254).parse(sanitized);
          break;
        
        case 'deviceId':
          z.string().min(5).max(20).regex(/^[a-zA-Z0-9]+$/).parse(sanitized);
          break;
        
        case 'imei':
          z.string().regex(/^\d{15}$/).parse(sanitized);
          // Validate IMEI checksum
          if (!this.validateLuhnAlgorithm(sanitized)) {
            return { isValid: false, error: 'Invalid IMEI checksum' };
          }
          break;
        
        case 'password':
          z.string().min(8).max(128).parse(sanitized);
          // Additional password strength validation
          if (!/(?=.*[a-z])/.test(sanitized)) {
            return { isValid: false, error: 'Password must contain lowercase letters' };
          }
          if (!/(?=.*[A-Z])/.test(sanitized)) {
            return { isValid: false, error: 'Password must contain uppercase letters' };
          }
          if (!/(?=.*\d)/.test(sanitized)) {
            return { isValid: false, error: 'Password must contain numbers' };
          }
          if (!/(?=.*[!@#$%^&*])/.test(sanitized)) {
            return { isValid: false, error: 'Password must contain special characters' };
          }
          break;
        
        case 'text':
          z.string().max(1000).parse(sanitized);
          break;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { isValid: false, error: error.errors[0].message };
      }
      return { isValid: false, error: 'Validation failed' };
    }

    return { isValid: true, sanitized };
  }

  // Enhanced rate limiting with progressive delays
  static checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts?: number; resetTime?: number } {
    const now = Date.now();
    const tracking = this.attemptTracking.get(identifier);

    if (!tracking) {
      this.attemptTracking.set(identifier, { count: 1, firstAttempt: now, blocked: false });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    // Reset if window has passed and not blocked
    if (now - tracking.firstAttempt > this.ATTEMPT_WINDOW && !tracking.blocked) {
      this.attemptTracking.set(identifier, { count: 1, firstAttempt: now, blocked: false });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    // Check if blocked
    if (tracking.blocked && now - tracking.firstAttempt < this.ATTEMPT_WINDOW) {
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: tracking.firstAttempt + this.ATTEMPT_WINDOW
      };
    }

    // Check if exceeded limit
    if (tracking.count >= this.MAX_ATTEMPTS) {
      tracking.blocked = true;
      return { 
        allowed: false, 
        remainingAttempts: 0,
        resetTime: tracking.firstAttempt + this.ATTEMPT_WINDOW
      };
    }

    // Increment and allow
    tracking.count++;
    return { 
      allowed: true, 
      remainingAttempts: this.MAX_ATTEMPTS - tracking.count 
    };
  }

  // Session security validation
  static validateSession(sessionData: any): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!sessionData.timestamp) {
      issues.push('Missing session timestamp');
    } else {
      const sessionAge = Date.now() - sessionData.timestamp;
      if (sessionAge > this.SESSION_TIMEOUT) {
        issues.push('Session expired');
      }
    }

    if (!sessionData.fingerprint) {
      issues.push('Missing session fingerprint');
    }

    if (!sessionData.userAgent) {
      issues.push('Missing user agent');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Generate secure session fingerprint
  static async generateSessionFingerprint(): Promise<string> {
    const fingerprint = {
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      platform: navigator.platform
    };
    
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(fingerprint));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

  // CSP (Content Security Policy) header generation
  static generateCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://bjkqxmvjuewshomihjqm.supabase.co wss://bjkqxmvjuewshomihjqm.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }
}
