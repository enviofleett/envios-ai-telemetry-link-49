
import { SecurityService } from './securityService';

export interface GP51DeviceParams {
  deviceid: string;
  imei?: string;
  devicename: string;
  devicetype: number;
  simnum?: string;
  timezone?: number;
  groupid?: number;
  loginname?: string;
  remark?: string;
  icon?: number;
  needloctype?: 1 | 2 | 7;
  calmileageway?: 0 | 1 | 2;
}

export interface GP51ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  deviceConfig?: GP51DeviceParams;
}

export class GP51ProtocolService {
  // GP51 Protocol mandatory parameters
  private static readonly MANDATORY_PARAMS = ['deviceid', 'devicename', 'devicetype'];
  
  // GP51 supported device types (based on protocol specification)
  private static readonly VALID_DEVICE_TYPES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  // GP51 supported location types
  private static readonly VALID_LOCATION_TYPES = [1, 2, 7] as const;
  
  // GP51 supported mileage calculation methods
  private static readonly VALID_MILEAGE_WAYS = [0, 1, 2] as const;

  /**
   * Validates device parameters according to GP51 protocol specifications
   */
  static validateDeviceParams(params: Partial<GP51DeviceParams>): GP51ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check mandatory parameters
    for (const param of this.MANDATORY_PARAMS) {
      if (!params[param as keyof GP51DeviceParams]) {
        errors.push(`Missing mandatory parameter: ${param}`);
      }
    }

    // Validate device ID format (GP51 specific)
    if (params.deviceid) {
      const deviceIdValidation = SecurityService.validateInput(params.deviceid, 'deviceId');
      if (!deviceIdValidation.isValid) {
        errors.push(`Invalid device ID: ${deviceIdValidation.error}`);
      }
      
      // GP51 specific device ID length requirements
      if (params.deviceid.length < 8 || params.deviceid.length > 15) {
        errors.push('Device ID must be 8-15 characters for GP51 compatibility');
      }
    }

    // Validate IMEI if provided (critical for GP51 device identification)
    if (params.imei) {
      const imeiValidation = SecurityService.validateInput(params.imei, 'imei');
      if (!imeiValidation.isValid) {
        errors.push(`Invalid IMEI: ${imeiValidation.error}`);
      }
    } else {
      warnings.push('IMEI not provided - recommended for unique device identification');
    }

    // Validate device type according to GP51 specification
    if (params.devicetype !== undefined) {
      if (!this.VALID_DEVICE_TYPES.includes(params.devicetype)) {
        errors.push(`Invalid device type: ${params.devicetype}. Must be one of: ${this.VALID_DEVICE_TYPES.join(', ')}`);
      }
    }

    // Validate SIM number format
    if (params.simnum) {
      if (!/^\d{13,20}$/.test(params.simnum)) {
        errors.push('SIM number must be 13-20 digits');
      }
    }

    // Validate timezone (GP51 supports UTC offsets)
    if (params.timezone !== undefined) {
      if (params.timezone < -12 || params.timezone > 12) {
        errors.push('Timezone must be between -12 and +12 hours');
      }
    }

    // Validate location type
    if (params.needloctype !== undefined) {
      if (!this.VALID_LOCATION_TYPES.includes(params.needloctype)) {
        errors.push(`Invalid location type: ${params.needloctype}. Must be one of: ${this.VALID_LOCATION_TYPES.join(', ')}`);
      }
    }

    // Validate mileage calculation method
    if (params.calmileageway !== undefined) {
      if (!this.VALID_MILEAGE_WAYS.includes(params.calmileageway)) {
        errors.push(`Invalid mileage calculation method: ${params.calmileageway}. Must be one of: ${this.VALID_MILEAGE_WAYS.join(', ')}`);
      }
    }

    // Validate device name
    if (params.devicename) {
      const nameValidation = SecurityService.validateInput(params.devicename, 'text');
      if (!nameValidation.isValid) {
        errors.push(`Invalid device name: ${nameValidation.error}`);
      }
      if (params.devicename.length > 50) {
        errors.push('Device name must not exceed 50 characters');
      }
    }

    // Build validated device configuration
    const deviceConfig: GP51DeviceParams = {
      deviceid: params.deviceid || '',
      devicename: params.devicename || '',
      devicetype: params.devicetype || 1,
      timezone: params.timezone || 0,
      groupid: params.groupid || 0,
      calmileageway: params.calmileageway || 0,
      needloctype: params.needloctype || 1,
      ...(params.imei && { imei: params.imei }),
      ...(params.simnum && { simnum: params.simnum }),
      ...(params.loginname && { loginname: params.loginname }),
      ...(params.remark && { remark: params.remark }),
      ...(params.icon && { icon: params.icon })
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      deviceConfig: errors.length === 0 ? deviceConfig : undefined
    };
  }

  /**
   * Generates GP51-compliant device registration payload
   */
  static createDeviceRegistrationPayload(params: GP51DeviceParams): any {
    return {
      action: 'adddevice',
      deviceid: params.deviceid,
      devicename: params.devicename,
      devicetype: params.devicetype,
      groupid: params.groupid || 0,
      deviceenable: 1, // Always enable new devices
      loginenable: 1, // Always enable login for new devices
      timezone: params.timezone || 0,
      calmileageway: params.calmileageway || 0,
      ...(params.imei && { imei: params.imei }),
      ...(params.simnum && { simnum: params.simnum }),
      ...(params.loginname && { loginname: params.loginname }),
      ...(params.remark && { remark: params.remark }),
      ...(params.icon && { icon: params.icon }),
      ...(params.needloctype && { needloctype: params.needloctype })
    };
  }

  /**
   * Validates device uniqueness constraints
   */
  static async validateDeviceUniqueness(deviceId: string, imei?: string): Promise<{ isUnique: boolean; conflicts: string[] }> {
    const conflicts: string[] = [];
    
    // This would typically check against the database
    // For now, we'll implement the validation structure
    
    // Check device ID uniqueness (critical for GP51)
    // In a real implementation, this would query the database
    
    // Check IMEI uniqueness if provided
    if (imei) {
      // IMEI must be globally unique across all devices
    }

    return {
      isUnique: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Performs GP51 device handshake simulation
   */
  static async performDeviceHandshake(deviceParams: GP51DeviceParams, token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // This would implement the actual GP51 handshake protocol
      // For now, we'll simulate the validation
      
      console.log(`Initiating GP51 handshake for device: ${deviceParams.deviceid}`);
      
      // Validate token
      if (!token) {
        return { success: false, error: 'Authentication token required for device handshake' };
      }

      // Simulate handshake success
      return { success: true };
    } catch (error) {
      return { success: false, error: `Handshake failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  /**
   * Gets default parameters for GP51 device types
   */
  static getDefaultParametersForDeviceType(deviceType: number): Partial<GP51DeviceParams> {
    const defaults: Record<number, Partial<GP51DeviceParams>> = {
      1: { timezone: 0, calmileageway: 0, needloctype: 1 }, // GPS Tracker
      2: { timezone: 0, calmileageway: 1, needloctype: 2 }, // Vehicle Tracker
      3: { timezone: 0, calmileageway: 0, needloctype: 1 }, // Personal Tracker
      4: { timezone: 0, calmileageway: 2, needloctype: 7 }, // Asset Tracker
      5: { timezone: 0, calmileageway: 1, needloctype: 2 }, // Fleet Tracker
    };

    return defaults[deviceType] || { timezone: 0, calmileageway: 0, needloctype: 1 };
  }
}
