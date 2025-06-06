
import { SecurityService } from './securityService';
import { GP51ProtocolService, GP51DeviceParams, GP51ValidationResult } from './gp51ProtocolService';
import { AuditService } from './auditService';
import { supabase } from '@/integrations/supabase/client';

export interface SecureVehicleCreationRequest {
  deviceid: string;
  devicename: string;
  devicetype: number;
  imei?: string;
  simnum?: string;
  timezone?: number;
  groupid?: number;
  loginname?: string;
  remark?: string;
  icon?: number;
  needloctype?: 1 | 2 | 7;
  calmileageway?: 0 | 1 | 2;
  creater: string; // GP51 admin username
}

export interface SecureVehicleCreationResult {
  success: boolean;
  deviceId?: string;
  errors: string[];
  warnings: string[];
  gp51ValidationResult?: GP51ValidationResult;
}

export class SecureVehicleService {

  /**
   * Creates a new vehicle with GP51 protocol compliance and security
   */
  static async createVehicleSecurely(
    adminUserId: string,
    vehicleRequest: SecureVehicleCreationRequest,
    clientIP?: string
  ): Promise<SecureVehicleCreationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Rate limiting check
      const rateLimitResult = SecurityService.checkRateLimit(`vehicle_creation_${adminUserId}`);
      if (!rateLimitResult.allowed) {
        await AuditService.logSecurityEvent(adminUserId, 'RATE_LIMIT_EXCEEDED', {
          action: 'vehicle_creation',
          clientIP
        }, false);
        return {
          success: false,
          errors: ['Rate limit exceeded. Please try again later.'],
          warnings
        };
      }

      // 2. Check admin permissions
      const hasPermission = SecurityService.hasPermission('admin', 'manage_vehicles');
      if (!hasPermission) {
        await AuditService.logSecurityEvent(adminUserId, 'UNAUTHORIZED_ACCESS', {
          action: 'vehicle_creation',
          clientIP
        }, false);
        return {
          success: false,
          errors: ['Insufficient permissions to create vehicles'],
          warnings
        };
      }

      // 3. GP51 Protocol Validation (Critical)
      const gp51Validation = GP51ProtocolService.validateDeviceParams(vehicleRequest);
      if (!gp51Validation.isValid) {
        errors.push(...gp51Validation.errors);
        await AuditService.logGP51ProtocolEvent(
          vehicleRequest.deviceid,
          'VALIDATION_FAILED',
          { errors: gp51Validation.errors, warnings: gp51Validation.warnings },
          false
        );
      }
      warnings.push(...gp51Validation.warnings);

      // 4. Input Security Validation
      const securityValidation = this.validateVehicleInputsSecurity(vehicleRequest);
      if (!securityValidation.isValid) {
        errors.push(...securityValidation.errors);
      }

      // 5. Device Uniqueness Check (Critical for GP51)
      const uniquenessCheck = await GP51ProtocolService.validateDeviceUniqueness(
        vehicleRequest.deviceid,
        vehicleRequest.imei
      );
      if (!uniquenessCheck.isUnique) {
        errors.push(...uniquenessCheck.conflicts);
      }

      // If validation failed, return errors
      if (errors.length > 0) {
        await AuditService.logVehicleCreation(adminUserId, vehicleRequest.deviceid, vehicleRequest, false, errors.join('; '));
        return { 
          success: false, 
          errors, 
          warnings,
          gp51ValidationResult: gp51Validation
        };
      }

      // 6. Apply GP51 default parameters for device type
      const defaultParams = GP51ProtocolService.getDefaultParametersForDeviceType(vehicleRequest.devicetype);
      const enhancedRequest = { ...defaultParams, ...vehicleRequest };

      // 7. Create GP51-compliant registration payload
      const registrationPayload = GP51ProtocolService.createDeviceRegistrationPayload(enhancedRequest);

      // 8. Create device in GP51 system
      const gp51Result = await this.createDeviceInGP51(registrationPayload);
      if (!gp51Result.success) {
        errors.push(gp51Result.error || 'Failed to create device in GP51 system');
        await AuditService.logVehicleCreation(adminUserId, vehicleRequest.deviceid, vehicleRequest, false, gp51Result.error);
        return { 
          success: false, 
          errors, 
          warnings,
          gp51ValidationResult: gp51Validation
        };
      }

      // 9. Perform GP51 Device Handshake
      const handshakeResult = await this.performDeviceHandshake(enhancedRequest, gp51Result.token!);
      if (!handshakeResult.success) {
        warnings.push(`Device handshake warning: ${handshakeResult.error}`);
      }

      // 10. Store device in local database
      const localResult = await this.createVehicleInLocalDB(enhancedRequest, adminUserId);
      if (!localResult.success) {
        // Rollback GP51 device creation
        await this.rollbackGP51DeviceCreation(vehicleRequest.deviceid, vehicleRequest.creater);
        errors.push('Failed to create vehicle in local database');
        await AuditService.logVehicleCreation(adminUserId, vehicleRequest.deviceid, vehicleRequest, false, 'Local DB creation failed');
        return { 
          success: false, 
          errors, 
          warnings,
          gp51ValidationResult: gp51Validation
        };
      }

      // 11. Success - log the action
      await AuditService.logVehicleCreation(adminUserId, vehicleRequest.deviceid, {
        ...vehicleRequest,
        gp51Compliant: true,
        handshakeSuccessful: handshakeResult.success
      }, true);

      await AuditService.logGP51ProtocolEvent(
        vehicleRequest.deviceid,
        'DEVICE_CREATED',
        { 
          deviceType: vehicleRequest.devicetype,
          imei: vehicleRequest.imei,
          validationPassed: true,
          handshakeSuccessful: handshakeResult.success
        },
        true
      );

      return {
        success: true,
        deviceId: vehicleRequest.deviceid,
        errors: [],
        warnings,
        gp51ValidationResult: gp51Validation
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await AuditService.logVehicleCreation(adminUserId, vehicleRequest.deviceid, vehicleRequest, false, errorMessage);
      
      return {
        success: false,
        errors: [`Vehicle creation failed: ${errorMessage}`],
        warnings,
        gp51ValidationResult: undefined
      };
    }
  }

  /**
   * Validates vehicle inputs for security vulnerabilities
   */
  private static validateVehicleInputsSecurity(vehicleRequest: SecureVehicleCreationRequest): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate device ID
    const deviceIdValidation = SecurityService.validateInput(vehicleRequest.deviceid, 'deviceId');
    if (!deviceIdValidation.isValid) {
      errors.push(`Device ID validation failed: ${deviceIdValidation.error}`);
    }

    // Validate device name
    const deviceNameValidation = SecurityService.validateInput(vehicleRequest.devicename, 'text');
    if (!deviceNameValidation.isValid) {
      errors.push(`Device name validation failed: ${deviceNameValidation.error}`);
    }

    // Validate IMEI if provided
    if (vehicleRequest.imei) {
      const imeiValidation = SecurityService.validateInput(vehicleRequest.imei, 'imei');
      if (!imeiValidation.isValid) {
        errors.push(`IMEI validation failed: ${imeiValidation.error}`);
      }
    }

    // Validate creator username
    const creatorValidation = SecurityService.validateInput(vehicleRequest.creater, 'username');
    if (!creatorValidation.isValid) {
      errors.push(`Creator validation failed: ${creatorValidation.error}`);
    }

    // Validate optional text fields
    if (vehicleRequest.remark) {
      const remarkValidation = SecurityService.validateInput(vehicleRequest.remark, 'text');
      if (!remarkValidation.isValid) {
        errors.push(`Remark validation failed: ${remarkValidation.error}`);
      }
    }

    if (vehicleRequest.loginname) {
      const loginNameValidation = SecurityService.validateInput(vehicleRequest.loginname, 'username');
      if (!loginNameValidation.isValid) {
        errors.push(`Login name validation failed: ${loginNameValidation.error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create device in GP51 system
   */
  private static async createDeviceInGP51(registrationPayload: any): Promise<{
    success: boolean;
    token?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-device-management', {
        body: registrationPayload
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.status !== 0) {
        return { success: false, error: data.cause || 'GP51 device creation failed' };
      }

      // Get current GP51 session token for handshake
      const { data: sessionData } = await supabase
        .from('gp51_sessions')
        .select('gp51_token')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return { 
        success: true, 
        token: sessionData?.gp51_token 
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown GP51 error' 
      };
    }
  }

  /**
   * Perform GP51 device handshake
   */
  private static async performDeviceHandshake(vehicleRequest: GP51DeviceParams, token: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    return await GP51ProtocolService.performDeviceHandshake(vehicleRequest, token);
  }

  /**
   * Create vehicle in local database
   */
  private static async createVehicleInLocalDB(vehicleRequest: GP51DeviceParams, adminUserId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('vehicles')
        .insert({
          device_id: vehicleRequest.deviceid,
          device_name: vehicleRequest.devicename,
          device_type: vehicleRequest.devicetype.toString(),
          sim_number: vehicleRequest.simnum,
          is_active: true,
          gp51_metadata: {
            imei: vehicleRequest.imei,
            timezone: vehicleRequest.timezone,
            groupid: vehicleRequest.groupid,
            loginname: vehicleRequest.loginname,
            remark: vehicleRequest.remark,
            icon: vehicleRequest.icon,
            needloctype: vehicleRequest.needloctype,
            calmileageway: vehicleRequest.calmileageway,
            gp51_compliant: true,
            created_by_admin: adminUserId,
            creation_timestamp: new Date().toISOString()
          }
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  }

  /**
   * Rollback GP51 device creation in case of failure
   */
  private static async rollbackGP51DeviceCreation(deviceId: string, createrUsername: string): Promise<void> {
    try {
      await supabase.functions.invoke('gp51-device-management', {
        body: {
          action: 'deletedevice',
          deviceid: deviceId,
          creater: createrUsername
        }
      });
    } catch (error) {
      console.error('Failed to rollback GP51 device creation:', error);
      await AuditService.logSecurityEvent(undefined, 'ROLLBACK_FAILED', {
        deviceId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, false);
    }
  }
}
