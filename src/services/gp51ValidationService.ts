
import { GP51ValidationResult, EnhancedCSVRowData } from '@/types/enhanced-csv-import';

class GP51ValidationService {
  private deviceTypeMapping: Record<string, string> = {
    'gps tracker': 'GPS_TRACKER',
    'gps': 'GPS_TRACKER',
    'tracker': 'GPS_TRACKER',
    'vehicle tracker': 'GPS_TRACKER',
    'car tracker': 'GPS_TRACKER',
    'fleet tracker': 'GPS_TRACKER',
    'asset tracker': 'ASSET_TRACKER',
    'personal tracker': 'PERSONAL_TRACKER'
  };

  private reservedUsernames = new Set([
    'admin', 'root', 'system', 'test', 'demo', 'guest', 'user', 'default'
  ]);

  async validateRow(row: EnhancedCSVRowData, existingUsernames: Set<string>): Promise<GP51ValidationResult> {
    const validationFlags: string[] = [];
    const conflicts: Array<{ type: string; message: string; suggestion?: string }> = [];
    let generatedUsername = '';
    let isValid = true;

    // Validate and generate username if needed
    if (!row.gp51_username || row.gp51_username.trim() === '') {
      generatedUsername = this.generateUsername(row.user_name, row.user_email, existingUsernames);
      validationFlags.push('auto_generated_username');
    } else {
      // Validate provided username
      const usernameValidation = this.validateUsername(row.gp51_username, existingUsernames);
      if (!usernameValidation.isValid) {
        conflicts.push({
          type: 'invalid_username',
          message: usernameValidation.error || 'Invalid username format',
          suggestion: `Consider using: ${this.generateUsername(row.user_name, row.user_email, existingUsernames)}`
        });
        isValid = false;
      }
    }

    // Validate device type and map to GP51 format
    const deviceTypeResult = this.validateAndMapDeviceType(row.device_type);
    if (!deviceTypeResult.isValid) {
      conflicts.push({
        type: 'invalid_device_type',
        message: `Unknown device type: ${row.device_type}`,
        suggestion: `Mapped to: ${deviceTypeResult.mappedType}`
      });
      validationFlags.push('device_type_mapped');
    }

    // Validate email format
    if (!this.isValidEmail(row.user_email)) {
      conflicts.push({
        type: 'invalid_email',
        message: 'Invalid email format',
        suggestion: 'Please provide a valid email address'
      });
      isValid = false;
    }

    // Validate device ID format (GP51 compatible)
    if (!this.isValidDeviceId(row.device_id)) {
      conflicts.push({
        type: 'invalid_device_id',
        message: 'Device ID format not compatible with GP51',
        suggestion: 'Use alphanumeric characters, max 20 chars'
      });
      validationFlags.push('device_id_warning');
    }

    // Check for required fields
    if (!row.user_name || row.user_name.trim() === '') {
      conflicts.push({
        type: 'missing_user_name',
        message: 'User name is required'
      });
      isValid = false;
    }

    if (!row.device_name || row.device_name.trim() === '') {
      conflicts.push({
        type: 'missing_device_name',
        message: 'Device name is required'
      });
      isValid = false;
    }

    return {
      isValid,
      generatedUsername: generatedUsername || row.gp51_username,
      validationFlags,
      deviceTypeMapping: deviceTypeResult.mappedType,
      conflicts
    };
  }

  private generateUsername(name: string, email: string, existingUsernames: Set<string>): string {
    // Clean and normalize the name
    const cleanName = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    
    // Extract email prefix
    const emailPrefix = email.split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 8);

    // Try different combinations
    const candidates = [
      cleanName,
      emailPrefix,
      `${cleanName}${Math.floor(Math.random() * 100)}`,
      `${emailPrefix}${Math.floor(Math.random() * 100)}`,
      `user${Date.now().toString().slice(-6)}`
    ];

    for (const candidate of candidates) {
      if (candidate.length >= 3 && 
          !this.reservedUsernames.has(candidate) && 
          !existingUsernames.has(candidate)) {
        return candidate;
      }
    }

    // Fallback: timestamp-based username
    return `user${Date.now().toString().slice(-8)}`;
  }

  private validateUsername(username: string, existingUsernames: Set<string>): { isValid: boolean; error?: string } {
    if (username.length < 3) {
      return { isValid: false, error: 'Username must be at least 3 characters' };
    }

    if (username.length > 20) {
      return { isValid: false, error: 'Username must be no more than 20 characters' };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { isValid: false, error: 'Username can only contain letters, numbers, hyphens, and underscores' };
    }

    if (this.reservedUsernames.has(username.toLowerCase())) {
      return { isValid: false, error: 'Username is reserved' };
    }

    if (existingUsernames.has(username)) {
      return { isValid: false, error: 'Username already exists' };
    }

    return { isValid: true };
  }

  private validateAndMapDeviceType(deviceType?: string): { isValid: boolean; mappedType: string } {
    if (!deviceType || deviceType.trim() === '') {
      return { isValid: true, mappedType: 'GPS_TRACKER' };
    }

    const normalized = deviceType.toLowerCase().trim();
    const mapped = this.deviceTypeMapping[normalized];

    if (mapped) {
      return { isValid: true, mappedType: mapped };
    }

    // Return a default mapping but mark as invalid for user awareness
    return { isValid: false, mappedType: 'GPS_TRACKER' };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidDeviceId(deviceId: string): boolean {
    // GP51 compatible device ID: alphanumeric, max 20 chars
    return /^[a-zA-Z0-9]{1,20}$/.test(deviceId);
  }

  generateCSVTemplate(): string {
    const headers = [
      'user_name',
      'user_email',
      'user_phone',
      'gp51_username',
      'device_id',
      'device_name',
      'device_type',
      'sim_number',
      'assignment_type',
      'notes'
    ];

    const sampleData = [
      'John Smith,john.smith@company.com,+1234567890,jsmith,DEV001,John\'s Vehicle,GPS Tracker,1234567890,assigned,Primary vehicle',
      'Jane Doe,jane.doe@company.com,+0987654321,,DEV002,Jane\'s Truck,GPS Tracker,0987654321,owner,Fleet truck #2'
    ];

    return [headers.join(','), ...sampleData].join('\n');
  }
}

export const gp51ValidationService = new GP51ValidationService();
