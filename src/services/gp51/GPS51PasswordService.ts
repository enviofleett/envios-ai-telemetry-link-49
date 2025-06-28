
import CryptoJS from 'crypto-js';

export interface PasswordHashResult {
  hash: string;
  isValid: boolean;
  error?: string;
}

export interface MD5TestCase {
  input: string;
  expected: string;
  description: string;
}

export class GPS51PasswordService {
  private static readonly MD5_LENGTH = 32;
  private static readonly HEX_PATTERN = /^[a-f0-9]{32}$/;

  /**
   * Create MD5 hash for GPS51 password authentication
   * GPS51 API requires: "32 digits and small letter"
   */
  static createPasswordHash(password: string): PasswordHashResult {
    try {
      if (!password) {
        return {
          hash: '',
          isValid: false,
          error: 'Password is required'
        };
      }

      // Ensure clean string input with UTF-8 encoding
      const cleanPassword = String(password).trim();
      
      // Create MD5 hash using crypto-js for browser compatibility
      const hash = CryptoJS.MD5(cleanPassword)
        .toString(CryptoJS.enc.Hex)
        .toLowerCase();
      
      // Validate hash format
      if (hash.length !== this.MD5_LENGTH) {
        return {
          hash: '',
          isValid: false,
          error: `Invalid MD5 hash length: ${hash.length}, expected ${this.MD5_LENGTH}`
        };
      }
      
      if (!this.HEX_PATTERN.test(hash)) {
        return {
          hash: '',
          isValid: false,
          error: 'Invalid MD5 hash format: must be 32 lowercase hexadecimal characters'
        };
      }
      
      return {
        hash,
        isValid: true
      };
    } catch (error) {
      return {
        hash: '',
        isValid: false,
        error: error instanceof Error ? error.message : 'Hash generation failed'
      };
    }
  }

  /**
   * Test MD5 implementation against known values
   */
  static getTestCases(): MD5TestCase[] {
    return [
      {
        input: "password",
        expected: "5f4dcc3b5aa765d61d8327deb882cf99",
        description: "Basic password test (main failing case)"
      },
      {
        input: "test",
        expected: "098f6bcd4621d373cade4e832627b4f6",
        description: "Simple test password"
      },
      {
        input: "123456",
        expected: "e10adc3949ba59abbe56e057f20f883e",
        description: "Numeric password"
      },
      {
        input: "hello",
        expected: "5d41402abc4b2a76b9719d911017c592",
        description: "Short text password"
      }
    ];
  }

  /**
   * Run all MD5 tests and return results
   */
  static runAllTests() {
    const testCases = this.getTestCases();
    const results = testCases.map(testCase => {
      const hashResult = this.createPasswordHash(testCase.input);
      const isMatch = hashResult.isValid && hashResult.hash === testCase.expected.toLowerCase();
      
      return {
        ...testCase,
        actualHash: hashResult.hash,
        isMatch,
        error: hashResult.error
      };
    });

    const passCount = results.filter(r => r.isMatch).length;
    const totalCount = results.length;
    
    return {
      results,
      summary: {
        passed: passCount === totalCount,
        passCount,
        totalCount,
        message: `${passCount}/${totalCount} tests passed`
      }
    };
  }

  /**
   * Validate input password before hashing
   */
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password must be a non-empty string' };
    }

    if (password.length > 1000) {
      return { isValid: false, error: 'Password is too long (max 1000 characters)' };
    }

    // Check for common security issues
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|\#|\/\*|\*\/)/,
      /(\bOR\b.*=.*\bOR\b)/i,
      /(\bAND\b.*=.*\bAND\b)/i
    ];

    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(password)) {
        return { isValid: false, error: 'Invalid characters detected in password' };
      }
    }

    return { isValid: true };
  }
}
