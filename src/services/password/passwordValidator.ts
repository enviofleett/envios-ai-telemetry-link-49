
import { PasswordPolicy, DEFAULT_POLICY } from './passwordPolicy';
import { COMMON_PASSWORDS } from './commonPasswords';

export interface PasswordValidationResult {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  score: number;
  feedback: string[];
  enforceableErrors: string[];
}

/**
 * Validates password with enforced production-ready policies
 */
export function validatePasswordStrength(
  password: string,
  userInfo?: { username?: string; email?: string; name?: string },
  policy: PasswordPolicy = DEFAULT_POLICY
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
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
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
    ].filter(Boolean) as string[];

    let containsUserInfo = false;
    for (const info of checks) {
      if (lowerPassword.includes(info)) {
        enforceableErrors.push('Password cannot contain personal information');
        containsUserInfo = true;
        break;
      }
    }
    if (!containsUserInfo) {
      score += 10;
    }
  } else {
    score += 10;
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

  if (charsetSize > 0) {
    const entropy = password.length * Math.log2(charsetSize);
    if (entropy >= 60) {
      score += 20;
      feedback.push('High entropy - excellent security');
    } else if (entropy >= 40) {
      score += 10;
      feedback.push('Good entropy');
    }
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
