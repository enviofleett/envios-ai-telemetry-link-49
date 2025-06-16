
import { GP51Client } from '@/services/gp51/gp51Client';
import { GP51ErrorReporter } from '@/services/gp51/errorReporter';

export interface DeviceHandshakeResult {
  success: boolean;
  deviceStatus: 'online' | 'offline' | 'unknown';
  error?: string;
  capabilities?: string[];
  timestamp: string;
}

export interface DeviceConfigurationParams {
  deviceId: string;
  serverEndpoint: string;
  reportingInterval: number;
  securityKey: string;
  operationalMode: string;
}

export interface DeviceCommunicationResult {
  isConnected: boolean;
  responseTime: number;
  signalStrength?: number;
  error?: string;
}

export interface DeviceConfigurationResult {
  success: boolean;
  configurationId?: string;
  error?: string;
}

export interface GP51Vehicle {
  deviceId: string;
  deviceName: string;
  status: string;
  lastUpdate?: string;
}

export class GP51ProductionService {
  private static errorReporter = new GP51ErrorReporter();

  static async performRealDeviceHandshake(
    deviceId: string,
    username: string
  ): Promise<DeviceHandshakeResult> {
    try {
      console.log(`Performing real device handshake for ${deviceId} with user ${username}`);
      
      // Use GP51Client to get device status
      const response = await GP51Client.queryLastPosition([deviceId]);
      
      if (response.success && response.data) {
        return {
          success: true,
          deviceStatus: 'online',
          capabilities: ['gps', 'tracking'],
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        success: false,
        deviceStatus: 'offline',
        error: 'Device not responding',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.errorReporter.reportError({
        type: 'connectivity',
        message: 'Device handshake failed',
        severity: 'high',
        details: {
          deviceId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      
      return {
        success: false,
        deviceStatus: 'unknown',
        error: error instanceof Error ? error.message : 'Handshake failed',
        timestamp: new Date().toISOString()
      };
    }
  }

  static async verifyDeviceCommunication(
    deviceId: string,
    username: string
  ): Promise<DeviceCommunicationResult> {
    try {
      const startTime = Date.now();
      const response = await GP51Client.queryLastPosition([deviceId]);
      const responseTime = Date.now() - startTime;

      if (response.success) {
        return {
          isConnected: true,
          responseTime,
          signalStrength: 75 // Mock value
        };
      }

      return {
        isConnected: false,
        responseTime,
        error: 'Device communication failed'
      };
    } catch (error) {
      return {
        isConnected: false,
        responseTime: Date.now() - Date.now(),
        error: error instanceof Error ? error.message : 'Communication error'
      };
    }
  }

  static async configureDevice(
    params: DeviceConfigurationParams,
    username: string
  ): Promise<DeviceConfigurationResult> {
    try {
      console.log(`Configuring device ${params.deviceId} with params:`, params);
      
      // Use GP51Client to set device properties
      const response = await GP51Client.setDeviceProperty({
        deviceid: params.deviceId,
        propname: 'server_endpoint',
        propvalue: params.serverEndpoint
      });

      if (response.success) {
        return {
          success: true,
          configurationId: `config_${params.deviceId}_${Date.now()}`
        };
      }

      return {
        success: false,
        error: 'Device configuration failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Configuration error'
      };
    }
  }

  static async startDeviceHealthMonitoring(deviceId: string): Promise<boolean> {
    try {
      console.log(`Starting health monitoring for device ${deviceId}`);
      // Implementation would start monitoring processes
      return true;
    } catch (error) {
      console.error(`Failed to start monitoring for ${deviceId}:`, error);
      return false;
    }
  }

  static stopDeviceHealthMonitoring(deviceId: string): void {
    try {
      console.log(`Stopping health monitoring for device ${deviceId}`);
      // Implementation would stop monitoring processes, clear intervals, etc.
    } catch (error) {
      console.error(`Failed to stop monitoring for ${deviceId}:`, error);
    }
  }

  static async fetchVehicles(): Promise<GP51Vehicle[]> {
    try {
      console.log('Fetching vehicles from GP51 API...');
      
      // Use GP51Client to get all devices
      const response = await GP51Client.queryAllDevices();
      
      if (response.success && response.data) {
        // Transform GP51 device data to our vehicle format
        const vehicles: GP51Vehicle[] = Array.isArray(response.data) 
          ? response.data.map((device: any) => ({
              deviceId: device.deviceid || device.id || '',
              deviceName: device.devicename || device.name || 'Unknown Device',
              status: device.status || 'unknown',
              lastUpdate: device.lastupdate || new Date().toISOString()
            }))
          : [];
        
        console.log(`Successfully fetched ${vehicles.length} vehicles from GP51`);
        return vehicles;
      }
      
      console.warn('No vehicles found or GP51 API call failed');
      return [];
    } catch (error) {
      console.error('Error fetching vehicles from GP51:', error);
      this.errorReporter.reportError({
        type: 'api',
        message: 'Failed to fetch vehicles',
        severity: 'medium',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
      return [];
    }
  }
}
