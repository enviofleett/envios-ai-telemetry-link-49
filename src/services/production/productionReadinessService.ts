
import { GP51ProductionService } from '../gp51ProductionService';

export interface ProductionVehicleCreationResult {
  success: boolean;
  vehicleId?: string;
  deviceHandshake?: any;
  configurationId?: string;
  warnings: string[];
  errors: string[];
  isProductionReady: boolean;
}

export class ProductionReadinessService {
  /**
   * Assesses production readiness of created vehicle
   */
  static async assessProductionReadiness(
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
