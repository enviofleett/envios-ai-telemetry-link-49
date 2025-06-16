
import { SecurityService } from '../securityService';
import { supabase } from '@/integrations/supabase/client';

export interface ProductionVehicleCreationRequest {
  deviceId: string;
  deviceName: string;
  deviceType: number;
  imei?: string;
  simNumber?: string;
  assignedUserId?: string;
  adminUserId: string;
  performHealthCheck?: boolean;
  enableMonitoring?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class DeviceValidationService {
  /**
   * Validates production vehicle request with enhanced checks
   */
  static async validateProductionVehicleRequest(
    request: ProductionVehicleCreationRequest
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Device ID validation
    const deviceIdValidation = SecurityService.validateInput(request.deviceId, 'deviceId');
    if (!deviceIdValidation.isValid) {
      errors.push(`Device ID validation failed: ${deviceIdValidation.error}`);
    }

    // IMEI validation (critical for production)
    if (request.imei) {
      const imeiValidation = SecurityService.validateInput(request.imei, 'imei');
      if (!imeiValidation.isValid) {
        errors.push(`IMEI validation failed: ${imeiValidation.error}`);
      }
    } else {
      warnings.push('No IMEI provided - recommended for production deployment');
    }

    // Device name validation
    if (!request.deviceName || request.deviceName.length < 3) {
      errors.push('Device name must be at least 3 characters long');
    }

    // Device type validation
    if (!request.deviceType || request.deviceType < 1 || request.deviceType > 10) {
      errors.push('Invalid device type - must be between 1 and 10');
    }

    // Check for existing device using raw SQL to bypass TS2589
    try {
      const { data: existingDevices, error: sqlError } = await supabase.rpc('check_device_exists', {
        device_id_param: request.deviceId
      });

      if (sqlError) {
        errors.push(`Database validation failed: ${sqlError.message}`);
      } else if (existingDevices && existingDevices.length > 0) {
        errors.push(`Device ID ${request.deviceId} is already registered`);
      }
    } catch (error) {
      // Fallback to simple check if RPC doesn't exist
      console.warn('RPC check_device_exists not found, using fallback');
      
      // Use direct SQL query as absolute fallback
      const { data: rawResult, error: rawError } = await supabase
        .from('vehicles')
        .select('gp51_device_id')
        .eq('gp51_device_id', request.deviceId)
        .limit(1);

      if (rawError) {
        errors.push(`Database validation failed: ${rawError.message}`);
      } else if (rawResult && rawResult.length > 0) {
        errors.push(`Device ID ${request.deviceId} is already registered`);
      }
    }

    // Admin user validation
    if (!request.adminUserId) {
      errors.push('Admin user ID is required for production vehicle creation');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generates secure device key for GP51 communication
   */
  static async generateSecureDeviceKey(): Promise<string> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
