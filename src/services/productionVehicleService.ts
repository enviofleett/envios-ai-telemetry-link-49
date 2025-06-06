
import { GP51ProductionService, DeviceHandshakeResult, DeviceConfigurationParams } from './gp51ProductionService';
import { SecurityService } from './securityService';
import { AuditService } from './auditService';
import { EnhancedSessionManager } from './enhancedSessionManager';
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

export interface ProductionVehicleCreationResult {
  success: boolean;
  vehicleId?: string;
  deviceHandshake?: DeviceHandshakeResult;
  configurationId?: string;
  warnings: string[];
  errors: string[];
  isProductionReady: boolean;
}

export class ProductionVehicleService {

  /**
   * Creates a vehicle with full production readiness checks
   */
  static async createVehicleWithProductionChecks(
    request: ProductionVehicleCreationRequest
  ): Promise<ProductionVehicleCreationResult> {
    const result: ProductionVehicleCreationResult = {
      success: false,
      warnings: [],
      errors: [],
      isProductionReady: false
    };

    console.log(`Creating production-ready vehicle for device: ${request.deviceId}`);

    try {
      // Phase 1: Security and Input Validation
      const validationResult = await this.validateProductionVehicleRequest(request);
      if (!validationResult.isValid) {
        result.errors.push(...validationResult.errors);
        result.warnings.push(...validationResult.warnings);
        return result;
      }

      // Phase 2: Session Validation and Security
      const sessionValidation = await EnhancedSessionManager.validateGP51Session(true);
      if (!sessionValidation.isValid) {
        result.errors.push(`Session validation failed: ${sessionValidation.error}`);
        return result;
      }

      if (sessionValidation.needsRotation) {
        result.warnings.push('GP51 session needs rotation for optimal security');
      }

      // Phase 3: Real Device Communication Test
      console.log('Performing real device handshake...');
      const handshakeResult = await GP51ProductionService.performRealDeviceHandshake(
        request.deviceId,
        sessionValidation.username || ''
      );

      result.deviceHandshake = handshakeResult;

      if (!handshakeResult.success || handshakeResult.deviceStatus !== 'online') {
        result.errors.push(`Device handshake failed: ${handshakeResult.error || 'Device not online'}`);
        return result;
      }

      // Phase 4: Device Communication Verification
      const communicationCheck = await GP51ProductionService.verifyDeviceCommunication(
        request.deviceId,
        sessionValidation.username || ''
      );

      if (!communicationCheck.isConnected) {
        result.errors.push(`Device communication verification failed: ${communicationCheck.error}`);
        return result;
      }

      if (communicationCheck.responseTime > 5000) {
        result.warnings.push(`High response time detected: ${communicationCheck.responseTime}ms`);
      }

      // Phase 5: Device Configuration
      const configParams: DeviceConfigurationParams = {
        deviceId: request.deviceId,
        serverEndpoint: 'https://tracking.envioapp.com/gp51',
        reportingInterval: 30, // 30 seconds for production
        securityKey: await this.generateSecureDeviceKey(),
        operationalMode: 'tracking'
      };

      const configResult = await GP51ProductionService.configureDevice(
        configParams,
        sessionValidation.username || ''
      );

      if (!configResult.success) {
        result.errors.push(`Device configuration failed: ${configResult.error}`);
        return result;
      }

      result.configurationId = configResult.configurationId;

      // Phase 6: Database Creation with Production Data
      const vehicleCreationResult = await this.createVehicleInDatabase(request, {
        handshakeResult,
        communicationCheck,
        configurationId: configResult.configurationId
      });

      if (!vehicleCreationResult.success) {
        result.errors.push(`Database creation failed: ${vehicleCreationResult.error}`);
        return result;
      }

      result.vehicleId = vehicleCreationResult.vehicleId;

      // Phase 7: Production Readiness Assessment
      const readinessAssessment = await this.assessProductionReadiness(request.deviceId, result);
      result.isProductionReady = readinessAssessment.isReady;
      result.warnings.push(...readinessAssessment.warnings);

      // Phase 8: Start Real-time Monitoring (if requested)
      if (request.enableMonitoring && result.isProductionReady) {
        await GP51ProductionService.startDeviceHealthMonitoring(request.deviceId);
        result.warnings.push('Real-time device health monitoring started');
      }

      // Log successful creation
      await AuditService.logVehicleCreation(
        request.adminUserId,
        request.deviceId,
        request,
        true
      );

      result.success = true;
      console.log(`Production vehicle creation completed for device: ${request.deviceId}`);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Production vehicle creation failed: ${errorMessage}`);

      await AuditService.logVehicleCreation(
        request.adminUserId,
        request.deviceId,
        request,
        false,
        errorMessage
      );

      return result;
    }
  }

  /**
   * Validates production vehicle request with enhanced checks
   */
  private static async validateProductionVehicleRequest(
    request: ProductionVehicleCreationRequest
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
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

    // Check for existing device
    const { data: existingVehicle, error: queryError } = await supabase
      .from('vehicles')
      .select('id, device_id')
      .eq('device_id', request.deviceId)
      .maybeSingle();

    if (queryError) {
      errors.push(`Database validation failed: ${queryError.message}`);
    } else if (existingVehicle) {
      errors.push(`Device ID ${request.deviceId} is already registered`);
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
   * Creates vehicle in database with production metadata
   */
  private static async createVehicleInDatabase(
    request: ProductionVehicleCreationRequest,
    productionData: {
      handshakeResult: DeviceHandshakeResult;
      communicationCheck: any;
      configurationId?: string;
    }
  ): Promise<{ success: boolean; vehicleId?: string; error?: string }> {
    try {
      const vehicleData = {
        device_id: request.deviceId,
        device_name: request.deviceName,
        envio_user_id: request.assignedUserId || null,
        status: 'active',
        is_active: true,
        gp51_metadata: {
          device_type: request.deviceType,
          imei: request.imei || null,
          sim_number: request.simNumber || null,
          handshake_result: JSON.parse(JSON.stringify(productionData.handshakeResult)),
          communication_check: JSON.parse(JSON.stringify(productionData.communicationCheck)),
          configuration_id: productionData.configurationId || null,
          production_ready: true,
          created_by_admin: request.adminUserId,
          creation_timestamp: new Date().toISOString()
        },
        last_position: {
          status: productionData.handshakeResult.deviceStatus,
          updatetime: new Date().toISOString(),
          production_verified: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicleData)
        .select('id')
        .single();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        vehicleId: data.id
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database creation failed'
      };
    }
  }

  /**
   * Assesses production readiness of created vehicle
   */
  private static async assessProductionReadiness(
    deviceId: string,
    creationResult: ProductionVehicleCreationResult
  ): Promise<{ isReady: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    let isReady = true;

    // Check device handshake success
    if (!creationResult.deviceHandshake?.success) {
      isReady = false;
      warnings.push('Device handshake failed - not production ready');
    }

    // Check device status
    if (creationResult.deviceHandshake?.deviceStatus !== 'online') {
      isReady = false;
      warnings.push('Device is not online - not production ready');
    }

    // Check configuration
    if (!creationResult.configurationId) {
      isReady = false;
      warnings.push('Device configuration incomplete - not production ready');
    }

    // Additional production readiness checks
    if (creationResult.errors.length > 0) {
      isReady = false;
      warnings.push('Creation errors present - resolve before production deployment');
    }

    // Check device capabilities (if available)
    if (creationResult.deviceHandshake?.capabilities?.length === 0) {
      warnings.push('No device capabilities reported - verify device functionality');
    }

    return { isReady, warnings };
  }

  /**
   * Generates secure device key for GP51 communication
   */
  private static async generateSecureDeviceKey(): Promise<string> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Performs bulk vehicle health assessment for production deployment
   */
  static async performBulkProductionHealthCheck(deviceIds: string[]): Promise<{
    totalDevices: number;
    productionReady: number;
    needsAttention: number;
    offline: number;
    healthReport: Array<{
      deviceId: string;
      status: 'ready' | 'needs_attention' | 'offline';
      issues: string[];
    }>;
  }> {
    console.log(`Performing bulk production health check for ${deviceIds.length} devices`);

    const healthReport: Array<{
      deviceId: string;
      status: 'ready' | 'needs_attention' | 'offline';
      issues: string[];
    }> = [];

    let productionReady = 0;
    let needsAttention = 0;
    let offline = 0;

    for (const deviceId of deviceIds) {
      try {
        const issues: string[] = [];
        
        // Check device communication
        const commCheck = await GP51ProductionService.verifyDeviceCommunication(deviceId, '');
        
        if (!commCheck.isConnected) {
          issues.push('Device not responding');
          offline++;
          healthReport.push({ deviceId, status: 'offline', issues });
          continue;
        }

        // Check response time
        if (commCheck.responseTime > 10000) {
          issues.push(`High response time: ${commCheck.responseTime}ms`);
        }

        // Check signal strength
        if (commCheck.signalStrength && commCheck.signalStrength < 30) {
          issues.push(`Low signal strength: ${commCheck.signalStrength}%`);
        }

        // Determine status
        if (issues.length === 0) {
          productionReady++;
          healthReport.push({ deviceId, status: 'ready', issues });
        } else {
          needsAttention++;
          healthReport.push({ deviceId, status: 'needs_attention', issues });
        }

      } catch (error) {
        offline++;
        healthReport.push({
          deviceId,
          status: 'offline',
          issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
        });
      }
    }

    return {
      totalDevices: deviceIds.length,
      productionReady,
      needsAttention,
      offline,
      healthReport
    };
  }
}
