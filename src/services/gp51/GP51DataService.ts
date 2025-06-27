
import type { 
  GP51HealthStatus,
  GP51DeviceTreeResponse as GP51ServiceResponse,
  GP51Position,
  GP51PerformanceMetrics,
  GP51Device as GP51DeviceData
} from '@/types/gp51-unified';
import { supabase } from '@/integrations/supabase/client';

export class GP51DataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  private isDataFresh(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? Date.now() - cached.timestamp < this.CACHE_TTL : false;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return this.isDataFresh(key) ? cached?.data : null;
  }

  async queryMonitorList(): Promise<GP51ServiceResponse> {
    const cacheKey = 'monitor_list';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('gp51-get-positions', {
        body: {
          username: 'octopus',
          password: 'bdb5f67d0bc5ee3468b4d2ef00e311f4eef48974be2a8cc8b4dde538d45e346a',
          deviceIds: [],
          lastQueryTime: 0
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to fetch device list');
      }

      const serviceResponse: GP51ServiceResponse = {
        success: true,
        data: data.positions || [],
        groups: []
      };

      this.setCache(cacheKey, serviceResponse);
      return serviceResponse;
    } catch (error) {
      console.error('queryMonitorList error:', error);
      return {
        success: false,
        data: [],
        groups: [],
        error: error instanceof Error ? error.message : 'Failed to fetch device list'
      };
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    const cacheKey = `positions_${deviceIds?.join(',') || 'all'}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('gp51-get-positions', {
        body: {
          username: 'octopus',
          password: 'bdb5f67d0bc5ee3468b4d2ef00e311f4eef48974be2a8cc8b4dde538d45e346a',
          deviceIds: deviceIds || [],
          lastQueryTime: 0
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Failed to fetch positions');
      }

      const positions = data.positions || [];
      this.setCache(cacheKey, positions);
      return positions;
    } catch (error) {
      console.error('getPositions error:', error);
      return [];
    }
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51Position>> {
    const positions = await this.getPositions(deviceIds);
    const devicePositions = new Map<string, GP51Position>();
    
    positions.forEach(pos => {
      if (deviceIds.includes(pos.deviceid)) {
        devicePositions.set(pos.deviceid, pos);
      }
    });
    
    return devicePositions;
  }

  async getLiveVehicles(): Promise<{
    success: boolean;
    data?: any[];
    groups?: any;
    error?: string;
  }> {
    try {
      const deviceTreeResult = await this.queryMonitorList();
      const positions = await this.getPositions();

      // Combine device data with position data
      const liveVehicles = deviceTreeResult.data?.map(device => {
        const position = positions.find(pos => pos.deviceid === device.deviceid);
        return {
          ...device,
          position,
          isOnline: position ? position.moving === 1 : false,
          isMoving: position ? position.moving === 1 : false,
          lastUpdate: position ? new Date(position.devicetime) : null
        };
      }) || [];

      return {
        success: true,
        data: liveVehicles,
        groups: deviceTreeResult.groups
      };
    } catch (error) {
      console.error('getLiveVehicles error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live vehicles'
      };
    }
  }

  async getHealthStatus(): Promise<GP51HealthStatus> {
    try {
      // Test connection by making a simple API call
      const startTime = Date.now();
      const result = await this.queryMonitorList();
      const responseTime = Date.now() - startTime;

      return {
        status: result.success ? 'healthy' : 'failed',
        lastCheck: new Date(),
        responseTime,
        isConnected: result.success,
        lastPingTime: new Date(),
        tokenValid: true,
        sessionValid: true,
        activeDevices: result.data?.length || 0,
        isHealthy: result.success,
        connectionStatus: result.success ? 'connected' : 'disconnected',
        errorMessage: result.error,
        lastChecked: new Date(),
        deviceCount: result.data?.length || 0,
        groupCount: result.groups?.length || 0
      };
    } catch (error) {
      return {
        status: 'failed',
        lastCheck: new Date(),
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errorMessage: error instanceof Error ? error.message : 'Health check failed',
        isHealthy: false,
        connectionStatus: 'error',
        lastChecked: new Date(),
        deviceCount: 0,
        groupCount: 0
      };
    }
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    const startTime = Date.now();
    const healthStatus = await this.getHealthStatus();
    const deviceTreeResult = await this.queryMonitorList();
    const positions = await this.getPositions();
    const responseTime = Date.now() - startTime;

    const now = new Date();
    const activeDevices = positions.filter(pos => pos.moving === 1).length;
    const movingVehicles = positions.filter(pos => pos.moving === 1).length;

    return {
      // Core metrics
      responseTime,
      success: healthStatus.isHealthy,
      requestStartTime: new Date(startTime).toISOString(),
      timestamp: now.toISOString(),
      
      // Count metrics
      deviceCount: deviceTreeResult.data?.length || 0,
      groupCount: deviceTreeResult.groups?.length || 0,
      apiCallCount: 1, // This call
      
      // Performance metrics
      errorRate: healthStatus.isHealthy ? 0 : 1,
      averageResponseTime: responseTime,
      
      // Vehicle metrics
      totalVehicles: deviceTreeResult.data?.length || 0,
      activeVehicles: activeDevices,
      activeDevices,
      movingVehicles,
      stoppedVehicles: activeDevices - movingVehicles,
      
      // Additional metrics
      lastUpdateTime: now,
      dataQuality: healthStatus.isHealthy ? 0.95 : 0,
      onlinePercentage: deviceTreeResult.data?.length ? 
        (activeDevices / deviceTreeResult.data.length) * 100 : 0,
      utilizationRate: deviceTreeResult.data?.length ? 
        (movingVehicles / deviceTreeResult.data.length) * 100 : 0
    };
  }

  async testConnection(): Promise<GP51HealthStatus> {
    return this.getHealthStatus();
  }

  processPositions(positions: GP51Position[]): GP51Position[] {
    // Add validation and processing
    return positions
      .filter(pos => {
        // Validate coordinates
        return Math.abs(pos.callat) <= 90 && Math.abs(pos.callon) <= 180;
      })
      .map(pos => ({
        ...pos,
        // Add computed fields
        latitude: pos.callat,
        longitude: pos.callon,
        // Validate and sanitize data
        speed: Math.max(0, pos.speed || 0),
        course: ((pos.course || 0) + 360) % 360
      }));
  }
}

export const gp51DataService = new GP51DataService();
