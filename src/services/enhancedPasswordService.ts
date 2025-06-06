
import { SecurityService } from './securityService';
import { AuditService } from './auditService';

export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  score: number;
  feedback: string[];
  enforceableErrors: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
  maxAge: number; // days
}

export class EnhancedPasswordService {
  private static readonly DEFAULT_POLICY: PasswordPolicy = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventCommonPasswords: true,
    preventUserInfo: true,
    maxAge: 90
  };

  private static readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', '12345678', '12345',
    'qwerty', 'abc123', 'password123', 'admin', 'administrator',
    'root', 'user', 'test', 'guest', 'welcome', 'login',
    '111111', '000000', 'dragon', 'monkey', 'letmein'
  ];

  /**
   * Validates password with enforced production-ready policies
   */
  static validatePasswordStrength(
    password: string,
    userInfo?: { username?: string; email?: string; name?: string },
    policy: PasswordPolicy = this.DEFAULT_POLICY
  ): PasswordValidationResult {
    const feedback: string[] = [];
    const enforceableErrors: string[] = [];
    let score = 0;

    // Length check (ENFORCED)
    if (password.length < policy.minLength) {
      enforceableErrors.push(`Password must be at least ${policy.minLength} characters long`);
    } else {
      score += Math.min(25, password.length * 2);
      if (password.length >= 16) {
        feedback.push('Excellent length');
      }
    }

    // Character type requirements (ENFORCED)
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (policy.requireUppercase && !hasUppercase) {
      enforceableErrors.push('Password must contain at least one uppercase letter');
    } else if (hasUppercase) {
      score += 10;
    }

    if (policy.requireLowercase && !hasLowercase) {
      enforceableErrors.push('Password must contain at least one lowercase letter');
    } else if (hasLowercase) {
      score += 10;
    }

    if (policy.requireNumbers && !hasNumbers) {
      enforceableErrors.push('Password must contain at least one number');
    } else if (hasNumbers) {
      score += 10;
    }

    if (policy.requireSpecialChars && !hasSpecialChars) {
      enforceableErrors.push('Password must contain at least one special character');
    } else if (hasSpecialChars) {
      score += 15;
    }

    // Common password check (ENFORCED)
    if (policy.preventCommonPasswords) {
      const lowerPassword = password.toLowerCase();
      if (this.COMMON_PASSWORDS.includes(lowerPassword)) {
        enforceableErrors.push('Password is too common and cannot be used');
      } else {
        score += 10;
      }
    }

    // User information check (ENFORCED)
    if (policy.preventUserInfo && userInfo) {
      const lowerPassword = password.toLowerCase();
      const checks = [
        userInfo.username?.toLowerCase(),
        userInfo.email?.toLowerCase().split('@')[0],
        userInfo.name?.toLowerCase()
      ].filter(Boolean);

      for (const info of checks) {
        if (info && lowerPassword.includes(info)) {
          enforceableErrors.push('Password cannot contain personal information');
          break;
        }
      }
      if (enforceableErrors.length === 0) {
        score += 10;
      }
    }

    // Pattern analysis (feedback only)
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeated characters');
      score -= 5;
    }

    if (/123|abc|qwe|asd|zxc/i.test(password)) {
      feedback.push('Avoid sequential characters');
      score -= 5;
    }

    // Entropy calculation
    const charsetSize = [
      hasLowercase ? 26 : 0,
      hasUppercase ? 26 : 0,
      hasNumbers ? 10 : 0,
      hasSpecialChars ? 32 : 0
    ].reduce((a, b) => a + b, 0);

    const entropy = password.length * Math.log2(charsetSize);
    if (entropy >= 60) {
      score += 20;
      feedback.push('High entropy - excellent security');
    } else if (entropy >= 40) {
      score += 10;
      feedback.push('Good entropy');
    }

    // Calculate strength
    score = Math.max(0, Math.min(100, score));
    let strength: 'weak' | 'medium' | 'strong' | 'very_strong';

    if (score >= 80) {
      strength = 'very_strong';
    } else if (score >= 60) {
      strength = 'strong';
    } else if (score >= 40) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }

    const isValid = enforceableErrors.length === 0;

    return {
      isValid,
      strength,
      score,
      feedback,
      enforceableErrors
    };
  }

  /**
   * Hashes password with production-grade security
   */
  static async hashPasswordSecurely(password: string): Promise<string> {
    // Use the SecurityService's secure hash instead of MD5
    return await SecurityService.secureHash(password);
  }

  /**
   * Verifies password against secure hash
   */
  static async verifyPasswordSecurely(password: string, hash: string): Promise<boolean> {
    return await SecurityService.verifyHash(password, hash);
  }

  /**
   * Generates secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + specialChars;
    const password = [];

    // Ensure at least one character from each category
    password.push(this.getRandomChar(lowercase));
    password.push(this.getRandomChar(uppercase));
    password.push(this.getRandomChar(numbers));
    password.push(this.getRandomChar(specialChars));

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password.push(this.getRandomChar(allChars));
    }

    // Shuffle the password
    for (let i = password.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [password[i], password[j]] = [password[j], password[i]];
    }

    return password.join('');
  }

  /**
   * Gets random character from charset
   */
  private static getRandomChar(charset: string): string {
    const randomIndex = Math.floor(Math.random() * charset.length);
    return charset[randomIndex];
  }

  /**
   * Checks if password needs to be changed based on age
   */
  static isPasswordExpired(lastChanged: Date, policy: PasswordPolicy = this.DEFAULT_POLICY): boolean {
    const daysSinceChange = (Date.now() - lastChanged.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceChange > policy.maxAge;
  }

  /**
   * Logs password-related security events
   */
  static async logPasswordEvent(
    userId: string,
    eventType: 'creation' | 'change' | 'validation_failed' | 'policy_violation',
    details: any
  ): Promise<void> {
    await AuditService.logSecurityEvent(userId, `PASSWORD_${eventType.toUpperCase()}`, details);
  }
}
