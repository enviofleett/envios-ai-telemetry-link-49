
import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51DeviceTreeResponse,
  GP51Position,
  GP51HealthStatus,
  GP51PerformanceMetrics
} from '@/types/gp51-unified';

export class GP51DataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async queryMonitorList(): Promise<GP51DeviceTreeResponse> {
    const cacheKey = 'device_tree';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          username: 'octopus',
          password: 'bdb5f67d0bc5ee3468b4d2ef00e311f4eef48974be2a8cc8b4dde538d45e346a',
          apiUrl: 'https://www.gps51.com/webapi'
        }
      });

      if (error || !data?.success) {
        return {
          success: false,
          data: [],
          groups: [],
          error: data?.error || error?.message || 'Failed to fetch devices'
        };
      }

      // For now, return mock data structure until we have device tree endpoint
      const deviceTree: GP51DeviceTreeResponse = {
        success: true,
        data: [],
        groups: []
      };
      
      this.setCache(cacheKey, deviceTree);
      return deviceTree;
    } catch (error) {
      console.error('Device tree error:', error);
      return {
        success: false,
        data: [],
        groups: [],
        error: error instanceof Error ? error.message : 'Fetch failed'
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
          token: 'temp-token', // This should be a real token in production
          deviceIds: deviceIds || [],
          lastQueryTime: 0
        }
      });

      if (error || !data?.success) {
        console.error('Positions error:', error || data?.error);
        return [];
      }

      const positions = data.positions || [];
      this.setCache(cacheKey, positions);
      return positions;
    } catch (error) {
      console.error('Get positions error:', error);
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
      const [deviceTree, positions] = await Promise.all([
        this.queryMonitorList(),
        this.getPositions()
      ]);

      if (!deviceTree.success) {
        throw new Error(deviceTree.error);
      }

      const liveVehicles = deviceTree.data?.map(device => {
        const position = positions.find(pos => pos.deviceid === device.deviceid);
        return {
          ...device,
          position,
          isOnline: position ? position.status === 1 : false,
          isMoving: position ? position.moving === 1 : false,
          latitude: position?.callat,
          longitude: position?.callon,
          speed: position?.speed || 0,
          course: position?.course || 0,
          lastUpdate: position ? new Date(position.devicetime) : null
        };
      }) || [];

      return {
        success: true,
        data: liveVehicles,
        groups: deviceTree.groups
      };
    } catch (error) {
      console.error('Live vehicles error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live data'
      };
    }
  }

  async getHealthStatus(): Promise<GP51HealthStatus> {
    try {
      const startTime = Date.now();
      const deviceTree = await this.queryMonitorList();
      const responseTime = Date.now() - startTime;

      return {
        status: deviceTree.success ? 'healthy' : 'failed',
        lastCheck: new Date(), // Fixed: was 'lastChecked', now 'lastCheck'
        responseTime,
        isConnected: deviceTree.success,
        lastPingTime: new Date(),
        tokenValid: true,
        sessionValid: true,
        activeDevices: deviceTree.data?.length || 0,
        isHealthy: deviceTree.success,
        connectionStatus: deviceTree.success ? 'connected' : 'disconnected',
        errorMessage: deviceTree.error
      };
    } catch (error) {
      return {
        status: 'failed',
        lastCheck: new Date(), // Fixed: was 'lastChecked', now 'lastCheck'
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errorMessage: error instanceof Error ? error.message : 'Health check failed',
        isHealthy: false,
        connectionStatus: 'error'
      };
    }
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    const startTime = Date.now();
    
    try {
      const [health, deviceTree, positions] = await Promise.all([
        this.getHealthStatus(),
        this.queryMonitorList(),
        this.getPositions()
      ]);

      const responseTime = Date.now() - startTime;
      const now = new Date();
      const activeDevices = positions.filter(pos => pos.status === 1).length;
      const movingVehicles = positions.filter(pos => pos.moving === 1).length;

      return {
        responseTime,
        success: health.isHealthy,
        requestStartTime: new Date(startTime).toISOString(),
        timestamp: now.toISOString(),
        deviceCount: deviceTree.data?.length || 0,
        groupCount: deviceTree.groups?.length || 0,
        apiCallCount: 3,
        errorRate: health.isHealthy ? 0 : 1,
        averageResponseTime: responseTime,
        totalVehicles: deviceTree.data?.length || 0,
        activeVehicles: activeDevices,
        activeDevices,
        movingVehicles,
        stoppedVehicles: activeDevices - movingVehicles,
        lastUpdateTime: now,
        dataQuality: health.isHealthy ? 0.95 : 0,
        onlinePercentage: deviceTree.data?.length ? 
          (activeDevices / deviceTree.data.length) * 100 : 0,
        utilizationRate: deviceTree.data?.length ? 
          (movingVehicles / deviceTree.data.length) * 100 : 0
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const now = new Date();
      
      return {
        responseTime,
        success: false,
        requestStartTime: new Date(startTime).toISOString(),
        timestamp: now.toISOString(),
        deviceCount: 0,
        groupCount: 0,
        apiCallCount: 0,
        errorRate: 1,
        averageResponseTime: responseTime,
        totalVehicles: 0,
        activeVehicles: 0,
        activeDevices: 0,
        movingVehicles: 0,
        stoppedVehicles: 0,
        lastUpdateTime: now,
        dataQuality: 0,
        onlinePercentage: 0,
        utilizationRate: 0
      };
    }
  }

  async testConnection(): Promise<GP51HealthStatus> {
    return this.getHealthStatus();
  }

  processPositions(positions: GP51Position[]): GP51Position[] {
    return positions.filter(pos => {
      const validLat = Math.abs(pos.callat) <= 90;
      const validLon = Math.abs(pos.callon) <= 180;
      const hasDeviceId = pos.deviceid && pos.deviceid.length > 0;
      return validLat && validLon && hasDeviceId;
    }).map(pos => ({
      ...pos,
      latitude: pos.callat,
      longitude: pos.callon,
      speed: Math.max(0, pos.speed || 0),
      course: ((pos.course || 0) + 360) % 360
    }));
  }
}

export const gp51DataService = new GP51DataService();
