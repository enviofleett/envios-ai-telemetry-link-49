
import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51DeviceTreeResponse,
  GP51Position,
  GP51HealthStatus,
  GP51PerformanceMetrics
} from '@/types/gp51-unified';
import type { GP51PositionRow, GP51DeviceRow } from '@/types/gp51-supabase';

export class SupabaseGP51DataService {

  async queryMonitorList(): Promise<GP51DeviceTreeResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-devices');

      if (error) {
        console.error('Device list error:', error);
        return {
          success: false,
          data: [],
          groups: [],
          error: error.message || 'Failed to fetch devices'
        };
      }

      if (!data?.success) {
        return {
          success: false,
          data: [],
          groups: [],
          error: data?.error || 'GP51 API error'
        };
      }

      return {
        success: true,
        data: data.devices || [],
        groups: data.groups || []
      };
    } catch (error) {
      console.error('Device list error:', error);
      return {
        success: false,
        data: [],
        groups: [],
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-get-positions', {
        body: { deviceIds: deviceIds || [] }
      });

      if (error) {
        console.error('Positions error:', error);
        return [];
      }

      if (!data?.success) {
        console.error('GP51 positions error:', data?.error);
        return [];
      }

      // Return the raw GP51Position data
      return data.positions || [];
    } catch (error) {
      console.error('Get positions error:', error);
      return [];
    }
  }

  async getCachedPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      // Use RPC to get positions to avoid type issues
      const { data, error } = await supabase.rpc('get_cached_positions', {
        p_device_ids: deviceIds || null
      });

      if (error) {
        console.error('Cached positions error:', error);
        return [];
      }

      // Transform the data to match GP51Position interface
      const positions: GP51Position[] = (data || []).map((row: any) => ({
        deviceid: row.device_id,
        callat: row.latitude,
        callon: row.longitude,
        speed: row.speed || 0,
        course: row.course || 0,
        altitude: row.altitude || 0,
        devicetime: row.device_time,
        status: row.status || 0,
        moving: row.moving || 0,
        gotsrc: row.gps_source || '',
        battery: row.battery || 0,
        signal: row.signal || 0,
        satellites: row.satellites || 0
      }));

      return positions;
    } catch (error) {
      console.error('Get cached positions error:', error);
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
        return {
          success: false,
          error: deviceTree.error
        };
      }

      // Combine device info with real-time positions
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

      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session;

      return {
        status: deviceTree.success ? 'healthy' : 'failed',
        lastCheck: new Date(),
        responseTime,
        isConnected: deviceTree.success,
        lastPingTime: new Date(),
        tokenValid: isAuthenticated,
        sessionValid: isAuthenticated,
        activeDevices: deviceTree.data?.length || 0,
        isHealthy: deviceTree.success && isAuthenticated,
        connectionStatus: deviceTree.success ? 'connected' : 'disconnected',
        errorMessage: deviceTree.error
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
      // Validate GPS coordinates
      const validLat = Math.abs(pos.callat) <= 90;
      const validLon = Math.abs(pos.callon) <= 180;
      return validLat && validLon && pos.deviceid;
    });
  }
}

export const supabaseGP51DataService = new SupabaseGP51DataService();
