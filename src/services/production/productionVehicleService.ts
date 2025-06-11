import { GP51ProductionService, DeviceHandshakeResult, DeviceConfigurationParams } from '../gp51ProductionService';
import { SecurityService } from '../securityService';
import { AuditService } from '../auditService';
import { EnhancedSessionManager } from '../enhancedSessionManager';
import { DeviceValidationService, type ProductionVehicleCreationRequest } from './deviceValidationService';
import { DatabaseOperationsService } from './databaseOperationsService';
import { ProductionReadinessService } from './productionReadinessService';
import { GP51DeviceActivationService } from '@/services/gp51DeviceActivationService';

export interface ProductionVehicleCreationResult {
  success: boolean;
  vehicleId?: string;
  deviceHandshake?: DeviceHandshakeResult;
  configurationId?: string;
  warnings: string[];
  errors: string[];
  isProductionReady: boolean;
}

export interface ProductionVehicleCreationRequest {
  deviceId: string;
  deviceName: string;
  deviceType: number;
  imei: string;
  simNumber: string;
  adminUserId: string;
  performHealthCheck: boolean;
  enableMonitoring: boolean;
  activateOnGP51?: boolean; // Add GP51 activation flag
}

export class ProductionVehicleService {
  /**
   * Creates a vehicle with full production readiness checks including GP51 activation
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
      const validationResult = await DeviceValidationService.validateProductionVehicleRequest(request);
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
        securityKey: await DeviceValidationService.generateSecureDeviceKey(),
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

      // Phase 5: GP51 Device Activation (NEW)
      if (request.activateOnGP51) {
        console.log('Activating device on GP51...');
        const activationResult = await GP51DeviceActivationService.activateDevice({
          deviceId: request.deviceId,
          deviceName: request.deviceName,
          deviceType: request.deviceType,
          years: 1,
          adminUserId: request.adminUserId
        });

        if (!activationResult.success) {
          result.errors.push(`GP51 device activation failed: ${activationResult.error}`);
          return result;
        }

        result.warnings.push('Device successfully activated on GP51');
      }

      // Phase 6: Database Creation with Production Data
      const vehicleCreationResult = await DatabaseOperationsService.createVehicleInDatabase(request, {
        handshakeResult,
        communicationCheck,
        configurationId: configResult.configurationId,
        activationStatus: request.activateOnGP51 ? 'active' : 'inactive'
      });

      if (!vehicleCreationResult.success) {
        result.errors.push(`Database creation failed: ${vehicleCreationResult.error}`);
        return result;
      }

      result.vehicleId = vehicleCreationResult.vehicleId;

      // Phase 7: Production Readiness Assessment
      const readinessAssessment = await ProductionReadinessService.assessProductionReadiness(request.deviceId, result);
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
   * Performs bulk vehicle health assessment for production deployment
   */
  static async performBulkProductionHealthCheck(deviceIds: string[]) {
    return ProductionReadinessService.performBulkProductionHealthCheck(deviceIds);
  }
}

// Re-export types for backward compatibility
export type { ProductionVehicleCreationRequest };
