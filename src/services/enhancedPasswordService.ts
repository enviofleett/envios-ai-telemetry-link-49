
import { SecurityService } from './securityService';
import { AuditService } from './auditService';
import { validatePasswordStrength } from './password/passwordValidator';
import { DEFAULT_POLICY } from './password/passwordPolicy';
import type { PasswordValidationResult } from './password/passwordValidator';
import type { PasswordPolicy } from './password/passwordPolicy';

export { type PasswordPolicy, type PasswordValidationResult };

export class EnhancedPasswordService {
  /**
   * Validates password with enforced production-ready policies
   */
  static validatePasswordStrength(
    password: string,
    userInfo?: { username?: string; email?: string; name?: string },
    policy: PasswordPolicy = DEFAULT_POLICY
  ): PasswordValidationResult {
    return validatePasswordStrength(password, userInfo, policy);
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
  static isPasswordExpired(lastChanged: Date, policy: PasswordPolicy = DEFAULT_POLICY): boolean {
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
