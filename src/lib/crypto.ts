import * as md5Lib from 'js-md5';

export class SecurityService {
  static generateSessionToken(): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.getRandomValues(new Uint8Array(16));
    const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
    const combinedString = `${timestamp}_${randomString}`;
    return md5Lib.default(combinedString);
  }

  static hashPassword(password: string, salt?: string): string {
    const actualSalt = salt || this.generateSalt();
    return md5Lib.default(`${password}${actualSalt}`);
  }

  static generateSalt(): string {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateInput(input: string, type: 'deviceId' | 'imei' | 'username'): { isValid: boolean; error?: string } {
    if (!input || input.trim().length === 0) {
      return { isValid: false, error: 'Input cannot be empty' };
    }

    switch (type) {
      case 'deviceId':
        if (input.length < 3 || input.length > 50) {
          return { isValid: false, error: 'Device ID must be between 3 and 50 characters' };
        }
        break;
      case 'imei':
        if (!/^\d{15}$/.test(input)) {
          return { isValid: false, error: 'IMEI must be exactly 15 digits' };
        }
        break;
      case 'username':
        if (input.length < 3 || input.length > 30) {
          return { isValid: false, error: 'Username must be between 3 and 30 characters' };
        }
        break;
    }

    return { isValid: true };
  }
}

export const calculateMd5 = (input: string): string => {
  return md5Lib.default(input);
};
