import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51ProcessedPosition, 
  GP51DeviceData, 
  GP51LiveVehiclesResponse,
  GP51ProcessResult,
  GP51TelemetryData
} from '@/types/gp51';
import type { GP51PerformanceMetrics } from '@/types/gp51Performance';

export class GP51DataService {
  private static instance: GP51DataService;

  static getInstance(): GP51DataService {
    if (!GP51DataService.instance) {
      GP51DataService.instance = new GP51DataService();
    }
    return GP51DataService.instance;
  }

  private constructor() {}

  async getDeviceList(): Promise<GP51DeviceData[]> {
    try {
      console.log('🔄 Fetching device list from GP51...');
      
      const { data, error } = await supabase.functions.invoke('gp51-device-list');
      
      if (error) {
        console.error('❌ Failed to fetch device list:', error);
        throw new Error(`Device list fetch failed: ${error.message}`);
      }

      if (!data?.success) {
        console.error('❌ GP51 device list API error:', data?.error);
        throw new Error(data?.error || 'Failed to fetch device list');
      }

      const devices = data.devices || [];
      console.log(`✅ Successfully fetched ${devices.length} devices`);
      
      return devices.map((device: any) => ({
        deviceId: device.deviceid || device.deviceId,
        deviceName: device.devicename || device.deviceName || device.name,
        deviceType: device.devicetype?.toString() || 'unknown',
        simNumber: device.simnum,
        groupId: device.groupId?.toString(),
        groupName: device.groupName,
        isActive: device.isfree === 1,
        lastActiveTime: device.lastactivetime
      }));
    } catch (error) {
      console.error('❌ Error fetching device list:', error);
      throw error;
    }
  }

  async getLiveVehicles(): Promise<GP51LiveVehiclesResponse> {
    try {
      console.log('🔄 Getting live vehicles data...');
      const devices = await this.getDeviceList();
      
      // Generate mock telemetry data for demonstration
      const telemetry: GP51TelemetryData[] = devices.map(device => ({
        deviceId: device.deviceId,
        timestamp: new Date().toISOString(),
        latitude: 0,
        longitude: 0,
        speed: 0,
        course: 0,
        status: 'active'
      }));

      return {
        success: true,
        data: {
          devices,
          telemetry,
          metadata: {
            totalDevices: devices.length,
            activeDevices: devices.filter(d => d.isActive).length,
            lastSync: new Date().toISOString()
          }
        }
      };
    } catch (error) {
      console.error('❌ Failed to get live vehicles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: {
          devices: [],
          telemetry: []
        }
      };
    }
  }

  async processVehicleData(data: GP51DeviceData[], options?: any): Promise<GP51ProcessResult> {
    try {
      console.log(`🔄 Processing ${data.length} vehicle records...`);
      
      let created = 0;
      let errors = 0;
      const errorDetails: { itemId: string; message: string }[] = [];

      // Process and validate each vehicle record
      for (const vehicle of data) {
        try {
          // Simulate processing logic
          if (vehicle.deviceId && vehicle.deviceName) {
            created++;
          } else {
            errors++;
            errorDetails.push({
              itemId: vehicle.deviceId || 'unknown',
              message: 'Missing required fields'
            });
          }
        } catch (error) {
          errors++;
          errorDetails.push({
            itemId: vehicle.deviceId || 'unknown',
            message: error instanceof Error ? error.message : 'Processing error'
          });
        }
      }
      
      console.log(`✅ Successfully processed ${created} vehicle records, ${errors} errors`);
      return { created, errors, errorDetails };
    } catch (error) {
      console.error('❌ Error processing vehicle data:', error);
      return { 
        created: 0, 
        errors: data.length, 
        errorDetails: [{ itemId: 'batch', message: error instanceof Error ? error.message : 'Batch processing failed' }]
      };
    }
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    const startTime = Date.now();
    
    try {
      // Simulate fetching performance data
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        responseTime,
        success: true,
        requestStartTime: new Date(startTime).toISOString(),
        deviceCount: 50,
        groupCount: 5,
        timestamp: new Date().toISOString(),
        apiCallCount: 1,
        errorRate: 0,
        averageResponseTime: responseTime
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      return {
        responseTime,
        success: false,
        requestStartTime: new Date(startTime).toISOString(),
        errorType: error instanceof Error ? error.message : 'Unknown error',
        deviceCount: 0,
        groupCount: 0,
        timestamp: new Date().toISOString(),
        apiCallCount: 1,
        errorRate: 100,
        averageResponseTime: responseTime
      };
    }
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51ProcessedPosition>> {
    console.log(`🔄 Fetching last positions for ${deviceIds.length} devices...`);
    
    const positions = new Map<string, GP51ProcessedPosition>();
    
    // Mock implementation - replace with actual GP51 API calls
    for (const deviceId of deviceIds) {
      positions.set(deviceId, {
        deviceId,
        deviceName: `Device ${deviceId}`,
        latitude: 0,
        longitude: 0,
        speed: 0, // Required field
        course: 0,
        timestamp: new Date(),
        statusText: 'active',
        isOnline: true,
        isMoving: false,
        status: 1
      });
    }
    
    return positions;
  }
}

export const gp51DataService = GP51DataService.getInstance();
