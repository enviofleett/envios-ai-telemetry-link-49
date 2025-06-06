
import { createHash } from 'crypto';

export class SecurityService {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static attemptTracking = new Map<string, { count: number; firstAttempt: number }>();

  // Replace MD5 with secure bcrypt-style hashing for GP51
  static async secureHash(password: string): Promise<string> {
    // Use a more secure hash with salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    
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
      
      const encoder = new TextEncoder();
      const data = encoder.encode(password + salt);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return computedHash === hash;
    } catch {
      return false;
    }
  }

  // Input validation with SQL injection protection
  static validateInput(input: string, type: 'username' | 'email' | 'deviceId' | 'imei' | 'text'): { isValid: boolean; error?: string } {
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
        if (!/^[a-zA-Z0-9]+$/.test(input)) {
          return { isValid: false, error: 'Device ID can only contain alphanumeric characters' };
        }
        break;
      
      case 'imei':
        if (!/^\d{15}$/.test(input)) {
          return { isValid: false, error: 'IMEI must be exactly 15 digits' };
        }
        // Luhn algorithm validation for IMEI
        if (!this.validateLuhnAlgorithm(input)) {
          return { isValid: false, error: 'Invalid IMEI checksum' };
        }
        break;
      
      case 'text':
        if (input.length > 1000) {
          return { isValid: false, error: 'Text input too long (max 1000 characters)' };
        }
        break;
    }

    return { isValid: true };
  }

  // Rate limiting implementation
  static checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts?: number } {
    const now = Date.now();
    const tracking = this.attemptTracking.get(identifier);

    if (!tracking) {
      this.attemptTracking.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    // Reset if window has passed
    if (now - tracking.firstAttempt > this.ATTEMPT_WINDOW) {
      this.attemptTracking.set(identifier, { count: 1, firstAttempt: now });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    // Check if exceeded limit
    if (tracking.count >= this.MAX_ATTEMPTS) {
      return { allowed: false, remainingAttempts: 0 };
    }

    // Increment and allow
    tracking.count++;
    return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - tracking.count };
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
}
