import { supabase } from '@/integrations/supabase/client';
import { GP51ApiValidator, GP51ApiResponse, GP51Group, GP51Device } from './GP51ApiValidator';
import { gp51ErrorReporter } from './errorReporter';
import type { 
  GP51ApiResponse as LegacyGP51ApiResponse, 
  GP51ProcessedPosition, 
  GP51Device as LegacyGP51Device 
} from '@/types/gp51';

export interface GP51PerformanceMetrics {
  requestStartTime: number;
  requestEndTime: number;
  responseTime: number;
  success: boolean;
  errorType?: string;
  deviceCount?: number;
  groupCount?: number;
}

export class GP51DataService {
  private static instance: GP51DataService;
  private performanceMetrics: GP51PerformanceMetrics[] = [];

  private constructor() {}

  static getInstance(): GP51DataService {
    if (!GP51DataService.instance) {
      GP51DataService.instance = new GP51DataService();
    }
    return GP51DataService.instance;
  }

  async getDeviceList(): Promise<LegacyGP51ApiResponse<LegacyGP51Device[]>> {
    const startTime = Date.now();
    
    try {
      console.log('🚗 GP51DataService: Fetching device list via enhanced querymonitorlist...');
      
      const { data, error } = await supabase.functions.invoke('gp51-device-list');

      if (error) {
        this.recordPerformanceMetric(startTime, false, 'edge_function_error');
        gp51ErrorReporter.reportError({
          type: 'api',
          message: `Device list fetch failed: ${error.message}`,
          severity: 'high',
          endpoint: 'gp51-device-list',
          details: error
        });
        
        console.error('❌ GP51DataService: Device list fetch failed:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        this.recordPerformanceMetric(startTime, false, 'gp51_api_error');
        gp51ErrorReporter.reportError({
          type: 'api',
          message: `GP51 API error: ${data.error}`,
          severity: 'high',
          endpoint: 'querymonitorlist',
          details: data
        });
        
        console.error('❌ GP51DataService: GP51 API error:', data.error);
        return { success: false, error: data.error };
      }

      // Enhanced validation using the new validator
      const validation = GP51ApiValidator.validateQueryMonitorListResponse(data.rawData);
      if (!validation.isValid) {
        this.recordPerformanceMetric(startTime, false, 'validation_error');
        gp51ErrorReporter.reportError({
          type: 'validation',
          message: `Response validation failed: ${validation.error}`,
          severity: 'medium',
          endpoint: 'querymonitorlist',
          details: { rawData: data.rawData, validationError: validation.error }
        });
        
        console.error('❌ GP51DataService: Response validation failed:', validation.error);
        return { success: false, error: `Invalid response format: ${validation.error}` };
      }

      // Process validated data
      const devices = this.mapGP51DevicesToLegacyFormat(validation.data!);
      const groupCount = validation.data!.groups?.length || 0;
      
      this.recordPerformanceMetric(startTime, true, undefined, devices.length, groupCount);
      
      console.log(`✅ GP51DataService: Retrieved ${devices.length} devices from ${groupCount} groups`);
      console.log(`📊 GP51DataService: Performance - Response time: ${Date.now() - startTime}ms`);
      
      return { success: true, data: devices };
      
    } catch (error) {
      this.recordPerformanceMetric(startTime, false, 'exception');
      gp51ErrorReporter.reportError({
        type: 'api',
        message: `Device list exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        endpoint: 'gp51-device-list',
        details: error,
        stackTrace: error instanceof Error ? error.stack : undefined
      });
      
      console.error('❌ GP51DataService: Device list exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch device list' 
      };
    }
  }

  private mapGP51DevicesToLegacyFormat(apiResponse: GP51ApiResponse): LegacyGP51Device[] {
    const devices: LegacyGP51Device[] = [];
    
    for (const group of apiResponse.groups || []) {
      for (const device of group.devices) {
        devices.push({
          deviceId: device.deviceid,
          deviceName: device.devicename,
          deviceType: device.devicetype,
          groupId: group.groupid,
          isOnline: GP51ApiValidator.isDeviceActive(device),
          lastUpdate: device.lastactivetime ? new Date(device.lastactivetime) : undefined,
          // Additional mapped properties from the API documentation
          simNumber: device.simnum,
          remark: device.remark,
          creater: device.creater,
          videoChannelCount: device.videochannelcount,
          overduetime: device.overduetime,
          expireNotifyTime: device.expirenotifytime,
          isFree: device.isfree,
          allowEdit: device.allowedit === 1,
          icon: device.icon,
          starred: device.stared === 1,
          loginName: device.loginame,
          statusText: GP51ApiValidator.getDeviceStatusText(device.isfree),
          groupName: group.groupname
        });
      }
    }
    
    return devices;
  }

  private recordPerformanceMetric(
    startTime: number, 
    success: boolean, 
    errorType?: string, 
    deviceCount?: number, 
    groupCount?: number
  ): void {
    const endTime = Date.now();
    const metric: GP51PerformanceMetrics = {
      requestStartTime: startTime,
      requestEndTime: endTime,
      responseTime: endTime - startTime,
      success,
      errorType,
      deviceCount,
      groupCount
    };
    
    this.performanceMetrics.push(metric);
    
    // Keep only the last 100 metrics to prevent memory issues
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
    
    // Log performance summary every 10 requests
    if (this.performanceMetrics.length % 10 === 0) {
      this.logPerformanceSummary();
    }
  }

  private logPerformanceSummary(): void {
    const recent = this.performanceMetrics.slice(-10);
    const avgResponseTime = recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
    const successRate = recent.filter(m => m.success).length / recent.length * 100;
    
    console.log(`📊 GP51DataService Performance Summary (last 10 requests):`);
    console.log(`  - Average response time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`  - Success rate: ${successRate.toFixed(1)}%`);
    console.log(`  - Total devices fetched: ${recent.reduce((sum, m) => sum + (m.deviceCount || 0), 0)}`);
  }

  getPerformanceMetrics(): GP51PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51ProcessedPosition>> {
    const positionsMap = new Map<string, GP51ProcessedPosition>();
    const startTime = Date.now();
    
    try {
      if (deviceIds.length === 0) {
        console.log('🗺️ GP51DataService: No device IDs provided for position fetch. Skipping.');
        return positionsMap;
      }

      console.log(`🗺️ GP51DataService: Fetching positions for ${deviceIds.length} devices...`);
      
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: { 
          deviceids: deviceIds.join(',')
        }
      });

      if (error) {
        gp51ErrorReporter.reportError({
          type: 'api',
          message: `Positions fetch failed: ${error.message}`,
          severity: 'medium',
          endpoint: 'fetchLiveGp51Data',
          details: { deviceIds, error }
        });
        
        console.error('❌ GP51DataService: Positions fetch failed:', error);
        return positionsMap;
      }

      if (!data.success) {
        gp51ErrorReporter.reportError({
          type: 'api',
          message: `GP51 positions API error: ${data.error}`,
          severity: 'medium',
          endpoint: 'lastposition',
          details: { deviceIds, response: data }
        });
        
        console.error('❌ GP51DataService: GP51 positions API error:', data.error);
        return positionsMap;
      }

      const positions: any[] = data.telemetry || [];
      console.log(`✅ GP51DataService: Retrieved positions for ${positions.length} devices`);
      console.log(`📊 GP51DataService: Position fetch response time: ${Date.now() - startTime}ms`);
      
      positions.forEach(pos => {
        if (pos.deviceId) {
          positionsMap.set(pos.deviceId, {
            ...pos,
            timestamp: new Date(pos.timestamp)
          });
        }
      });

    } catch (error) {
      gp51ErrorReporter.reportError({
        type: 'api',
        message: `Positions exception: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'high',
        endpoint: 'fetchLiveGp51Data',
        details: { deviceIds, error },
        stackTrace: error instanceof Error ? error.stack : undefined
      });
      
      console.error('❌ GP51DataService: Positions exception:', error);
    }
    
    return positionsMap;
  }
  
  // Stub for backward compatibility with read-only components
  async getLiveVehicles(): Promise<any> {
      console.warn('GP51DataService.getLiveVehicles is deprecated and should not be used.');
      return { success: true, data: { devices: [], telemetry: [] } };
  }

  // Stub for backward compatibility with read-only components
  // Updated to accept any arguments to avoid breaking read-only components.
  async processVehicleData(...args: any[]): Promise<any> {
      console.warn('GP51DataService.processVehicleData is deprecated and should not be used. It was called with:', args);
      return { success: true, created: 0, updated: 0, errors: [] };
  }
}

// Export singleton instance
export const gp51DataService = GP51DataService.getInstance();

// Export types for backward compatibility
export type { GP51ProcessedPosition } from '@/types/gp51';
