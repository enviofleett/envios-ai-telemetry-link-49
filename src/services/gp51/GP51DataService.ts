
import { supabase } from '@/integrations/supabase/client';
import { GP51ApiValidator, type GP51ApiResponse, type GP51Device, type GP51Group } from './GP51ApiValidator';
import type { GP51PerformanceMetrics } from '@/types/gp51Performance';

export interface GP51ProcessedPosition {
  deviceId: string;
  deviceName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  course: number;
  status?: string;
  statusText: string;
  isOnline: boolean;
  isMoving: boolean;
}

export interface GP51DeviceData {
  deviceId: string;
  deviceName: string;
  deviceType: number;
  simNumber?: string;
  groupId?: number;
  groupName?: string;
  isActive: boolean;
  lastActiveTime?: number;
}

export interface GP51LiveVehiclesResponse {
  success: boolean;
  error?: string;
  data: GP51DeviceData[];
}

export interface GP51ProcessResult {
  created: number;
  errors: number;
  errorDetails?: { itemId: string; message: string }[];
}

export class GP51DataService {
  private static instance: GP51DataService;
  private performanceMetrics: GP51PerformanceMetrics;

  private constructor() {
    this.performanceMetrics = {
      responseTime: 0,
      success: true,
      requestStartTime: new Date().toISOString(),
      deviceCount: 0,
      groupCount: 0,
      timestamp: new Date().toISOString(),
      apiCallCount: 0,
      errorRate: 0,
      averageResponseTime: 0
    };
  }

  static getInstance(): GP51DataService {
    if (!GP51DataService.instance) {
      GP51DataService.instance = new GP51DataService();
    }
    return GP51DataService.instance;
  }

  async getDeviceList(): Promise<GP51DeviceData[]> {
    const startTime = Date.now();
    this.performanceMetrics.requestStartTime = new Date().toISOString();
    this.performanceMetrics.apiCallCount++;

    try {
      console.log('🔄 Fetching device list from GP51...');
      
      const { data, error } = await supabase.functions.invoke('gp51-device-list');
      
      if (error) {
        console.error('❌ Error fetching device list:', error);
        this.updateMetricsOnError(startTime, 'SUPABASE_ERROR');
        throw new Error(`Failed to fetch device list: ${error.message}`);
      }

      if (!data?.success) {
        console.error('❌ GP51 API returned unsuccessful response:', data);
        this.updateMetricsOnError(startTime, 'GP51_API_ERROR');
        throw new Error(data?.error || 'GP51 API returned unsuccessful response');
      }

      // Validate the GP51 API response
      const validation = GP51ApiValidator.validateQueryMonitorListResponse(data.rawData);
      if (!validation.isValid) {
        console.error('❌ Invalid GP51 API response:', validation.error);
        this.updateMetricsOnError(startTime, 'VALIDATION_ERROR');
        throw new Error(`Invalid GP51 response: ${validation.error}`);
      }

      const devices = this.processDevicesFromGroups(validation.data!.groups || []);
      
      // Update performance metrics on success
      this.updateMetricsOnSuccess(startTime, devices.length, validation.data!.groups?.length || 0);
      
      console.log(`✅ Successfully fetched ${devices.length} devices from ${validation.data!.groups?.length || 0} groups`);
      return devices;

    } catch (error) {
      console.error('❌ Failed to fetch device list:', error);
      this.updateMetricsOnError(startTime, 'UNKNOWN_ERROR');
      throw error;
    }
  }

  async getLiveVehicles(): Promise<GP51LiveVehiclesResponse> {
    try {
      console.log('🔄 Getting live vehicles data...');
      const devices = await this.getDeviceList();
      return {
        success: true,
        data: devices
      };
    } catch (error) {
      console.error('❌ Failed to get live vehicles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
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
    return { ...this.performanceMetrics };
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51ProcessedPosition>> {
    console.log(`🔄 Fetching last positions for ${deviceIds.length} devices...`);
    
    const positions = new Map<string, GP51ProcessedPosition>();
    
    // Mock implementation - in a real scenario, this would call GP51's position API
    for (const deviceId of deviceIds) {
      positions.set(deviceId, {
        deviceId,
        deviceName: `Device ${deviceId}`,
        latitude: 0,
        longitude: 0,
        timestamp: new Date().toISOString(),
        course: 0,
        statusText: 'active',
        isOnline: true,
        isMoving: false,
        status: 'active'
      });
    }
    
    return positions;
  }

  private processDevicesFromGroups(groups: GP51Group[]): GP51DeviceData[] {
    const devices: GP51DeviceData[] = [];
    
    for (const group of groups) {
      if (group.devices && Array.isArray(group.devices)) {
        for (const device of group.devices) {
          try {
            const processedDevice: GP51DeviceData = {
              deviceId: device.deviceid,
              deviceName: device.devicename,
              deviceType: device.devicetype,
              simNumber: device.simnum,
              groupId: group.groupid,
              groupName: group.groupname,
              isActive: GP51ApiValidator.isDeviceActive(device),
              lastActiveTime: device.lastactivetime
            };
            
            devices.push(processedDevice);
          } catch (error) {
            console.warn(`⚠️ Skipping invalid device in group ${group.groupid}:`, error);
          }
        }
      }
    }
    
    return devices;
  }

  private updateMetricsOnSuccess(startTime: number, deviceCount: number, groupCount: number): void {
    const responseTime = Date.now() - startTime;
    this.performanceMetrics = {
      ...this.performanceMetrics,
      responseTime,
      success: true,
      deviceCount,
      groupCount,
      timestamp: new Date().toISOString(),
      averageResponseTime: (this.performanceMetrics.averageResponseTime + responseTime) / 2,
      errorRate: Math.max(0, this.performanceMetrics.errorRate - 0.1) // Gradually decrease error rate on success
    };
  }

  private updateMetricsOnError(startTime: number, errorType: string): void {
    const responseTime = Date.now() - startTime;
    this.performanceMetrics = {
      ...this.performanceMetrics,
      responseTime,
      success: false,
      errorType,
      timestamp: new Date().toISOString(),
      errorRate: Math.min(100, this.performanceMetrics.errorRate + 1) // Increase error rate on failure
    };
  }

  // Health check method
  async checkHealth(): Promise<boolean> {
    try {
      const devices = await this.getDeviceList();
      return devices.length >= 0; // Consider healthy if we can fetch data
    } catch (error) {
      return false;
    }
  }
}

export const gp51DataService = GP51DataService.getInstance();
