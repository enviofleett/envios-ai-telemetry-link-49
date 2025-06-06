
import { SecurityService } from './securityService';
import { AuditService } from './auditService';
import { supabase } from '@/integrations/supabase/client';

export interface DeviceHandshakeResult {
  success: boolean;
  deviceStatus: 'online' | 'offline' | 'error';
  capabilities?: string[];
  firmwareVersion?: string;
  lastSeen?: string;
  error?: string;
}

export interface DeviceConfigurationParams {
  deviceId: string;
  serverEndpoint: string;
  reportingInterval: number;
  securityKey: string;
  operationalMode: 'tracking' | 'monitoring' | 'fleet';
  geofenceSettings?: any;
}

export class GP51ProductionService {
  private static readonly HANDSHAKE_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_RETRY_ATTEMPTS = 3;
  private static readonly DEVICE_HEALTH_CHECK_INTERVAL = 60000; // 1 minute

  /**
   * Performs real GP51 device handshake with actual protocol communication
   */
  static async performRealDeviceHandshake(
    deviceId: string, 
    token: string,
    timeout: number = this.HANDSHAKE_TIMEOUT
  ): Promise<DeviceHandshakeResult> {
    console.log(`Initiating real GP51 handshake for device: ${deviceId}`);
    
    try {
      // Validate device ID format first
      const deviceValidation = SecurityService.validateInput(deviceId, 'deviceId');
      if (!deviceValidation.isValid) {
        return {
          success: false,
          deviceStatus: 'error',
          error: `Invalid device ID: ${deviceValidation.error}`
        };
      }

      // Call GP51 API for real device communication
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'ping_device',
          deviceid: deviceId,
          timeout: timeout
        }
      });

      if (error) {
        await AuditService.logGP51ProtocolEvent(deviceId, 'HANDSHAKE_FAILED', {
          error: error.message,
          timeout
        }, false);

        return {
          success: false,
          deviceStatus: 'error',
          error: `Handshake failed: ${error.message}`
        };
      }

      // Parse GP51 response
      if (data.status === 0 && data.device_status) {
        const deviceStatus = data.device_status.toLowerCase();
        const result: DeviceHandshakeResult = {
          success: true,
          deviceStatus: deviceStatus as 'online' | 'offline' | 'error',
          capabilities: data.capabilities || [],
          firmwareVersion: data.firmware_version,
          lastSeen: data.last_seen
        };

        await AuditService.logGP51ProtocolEvent(deviceId, 'HANDSHAKE_SUCCESS', {
          deviceStatus,
          capabilities: result.capabilities,
          firmwareVersion: result.firmwareVersion
        }, true);

        return result;
      }

      return {
        success: false,
        deviceStatus: 'offline',
        error: data.cause || 'Device not responding'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown handshake error';
      
      await AuditService.logGP51ProtocolEvent(deviceId, 'HANDSHAKE_ERROR', {
        error: errorMessage,
        timeout
      }, false);

      return {
        success: false,
        deviceStatus: 'error',
        error: errorMessage
      };
    }
  }

  /**
   * Verifies device communication and connectivity in real-time
   */
  static async verifyDeviceCommunication(deviceId: string, token: string): Promise<{
    isConnected: boolean;
    responseTime: number;
    signalStrength?: number;
    lastDataReceived?: string;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      console.log(`Verifying communication for device: ${deviceId}`);

      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'check_device_status',
          deviceid: deviceId
        }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          isConnected: false,
          responseTime,
          error: error.message
        };
      }

      if (data.status === 0) {
        return {
          isConnected: true,
          responseTime,
          signalStrength: data.signal_strength,
          lastDataReceived: data.last_data_received
        };
      }

      return {
        isConnected: false,
        responseTime,
        error: data.cause || 'Communication verification failed'
      };

    } catch (error) {
      return {
        isConnected: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Verification error'
      };
    }
  }

  /**
   * Configures device with GP51-compliant parameters
   */
  static async configureDevice(
    params: DeviceConfigurationParams,
    token: string
  ): Promise<{ success: boolean; configurationId?: string; error?: string }> {
    try {
      console.log(`Configuring device ${params.deviceId} with GP51 parameters`);

      // Validate all configuration parameters
      const validation = this.validateDeviceConfiguration(params);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Configuration validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Send configuration to device via GP51 protocol
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'configure_device',
          deviceid: params.deviceId,
          server_endpoint: params.serverEndpoint,
          reporting_interval: params.reportingInterval,
          security_key: params.securityKey,
          operational_mode: params.operationalMode,
          geofence_settings: params.geofenceSettings
        }
      });

      if (error) {
        await AuditService.logGP51ProtocolEvent(params.deviceId, 'CONFIGURATION_FAILED', {
          error: error.message,
          params
        }, false);

        return {
          success: false,
          error: error.message
        };
      }

      if (data.status === 0) {
        await AuditService.logGP51ProtocolEvent(params.deviceId, 'CONFIGURATION_SUCCESS', {
          configurationId: data.configuration_id,
          params
        }, true);

        return {
          success: true,
          configurationId: data.configuration_id
        };
      }

      return {
        success: false,
        error: data.cause || 'Device configuration failed'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Configuration error';
      
      await AuditService.logGP51ProtocolEvent(params.deviceId, 'CONFIGURATION_ERROR', {
        error: errorMessage,
        params
      }, false);

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Validates device configuration parameters
   */
  private static validateDeviceConfiguration(params: DeviceConfigurationParams): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate device ID
    const deviceIdValidation = SecurityService.validateInput(params.deviceId, 'deviceId');
    if (!deviceIdValidation.isValid) {
      errors.push(`Device ID: ${deviceIdValidation.error}`);
    }

    // Validate server endpoint
    if (!params.serverEndpoint || !this.isValidUrl(params.serverEndpoint)) {
      errors.push('Server endpoint must be a valid URL');
    }

    // Validate reporting interval
    if (!params.reportingInterval || params.reportingInterval < 10 || params.reportingInterval > 3600) {
      errors.push('Reporting interval must be between 10 and 3600 seconds');
    }

    // Validate security key
    if (!params.securityKey || params.securityKey.length < 16) {
      errors.push('Security key must be at least 16 characters');
    }

    // Validate operational mode
    if (!['tracking', 'monitoring', 'fleet'].includes(params.operationalMode)) {
      errors.push('Invalid operational mode');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Monitors device health in real-time
   */
  static async startDeviceHealthMonitoring(deviceId: string): Promise<void> {
    console.log(`Starting health monitoring for device: ${deviceId}`);

    const monitoringInterval = setInterval(async () => {
      try {
        const healthStatus = await this.checkDeviceHealth(deviceId);
        
        // Update device status in database
        await supabase
          .from('vehicles')
          .update({
            last_position: {
              ...healthStatus,
              updatetime: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('device_id', deviceId);

        // Log critical health issues
        if (!healthStatus.isHealthy) {
          await AuditService.logGP51ProtocolEvent(deviceId, 'HEALTH_ALERT', {
            healthStatus,
            alertLevel: healthStatus.criticalIssues ? 'critical' : 'warning'
          }, false);
        }

      } catch (error) {
        console.error(`Health monitoring error for device ${deviceId}:`, error);
      }
    }, this.DEVICE_HEALTH_CHECK_INTERVAL);

    // Store monitoring reference for cleanup
    this.storeMonitoringReference(deviceId, monitoringInterval);
  }

  /**
   * Checks device health status
   */
  private static async checkDeviceHealth(deviceId: string): Promise<{
    isHealthy: boolean;
    signalStrength: number;
    batteryLevel?: number;
    lastCommunication: string;
    criticalIssues: string[];
    warnings: string[];
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'get_device_health',
          deviceid: deviceId
        }
      });

      if (error || data.status !== 0) {
        return {
          isHealthy: false,
          signalStrength: 0,
          lastCommunication: new Date().toISOString(),
          criticalIssues: ['Communication failure'],
          warnings: []
        };
      }

      const criticalIssues: string[] = [];
      const warnings: string[] = [];

      // Analyze health data
      if (data.signal_strength < 20) {
        criticalIssues.push('Low signal strength');
      } else if (data.signal_strength < 50) {
        warnings.push('Moderate signal strength');
      }

      if (data.battery_level && data.battery_level < 10) {
        criticalIssues.push('Critical battery level');
      } else if (data.battery_level && data.battery_level < 30) {
        warnings.push('Low battery level');
      }

      return {
        isHealthy: criticalIssues.length === 0,
        signalStrength: data.signal_strength || 0,
        batteryLevel: data.battery_level,
        lastCommunication: data.last_communication || new Date().toISOString(),
        criticalIssues,
        warnings
      };

    } catch (error) {
      return {
        isHealthy: false,
        signalStrength: 0,
        lastCommunication: new Date().toISOString(),
        criticalIssues: ['Health check failed'],
        warnings: []
      };
    }
  }

  /**
   * Validates URL format
   */
  private static isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stores monitoring reference for cleanup
   */
  private static storeMonitoringReference(deviceId: string, interval: NodeJS.Timeout): void {
    // In a production environment, this would be stored in a more persistent way
    // For now, we'll use a simple map
    if (!window.deviceMonitoringIntervals) {
      window.deviceMonitoringIntervals = new Map();
    }
    window.deviceMonitoringIntervals.set(deviceId, interval);
  }

  /**
   * Stops device health monitoring
   */
  static stopDeviceHealthMonitoring(deviceId: string): void {
    if (window.deviceMonitoringIntervals?.has(deviceId)) {
      clearInterval(window.deviceMonitoringIntervals.get(deviceId));
      window.deviceMonitoringIntervals.delete(deviceId);
      console.log(`Stopped health monitoring for device: ${deviceId}`);
    }
  }
}

// Extend window interface for monitoring intervals
declare global {
  interface Window {
    deviceMonitoringIntervals?: Map<string, NodeJS.Timeout>;
  }
}
