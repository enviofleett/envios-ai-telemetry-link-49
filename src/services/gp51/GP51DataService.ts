
import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51HealthStatus, 
  GP51ServiceResponse, 
  GP51Position,
  GP51PerformanceMetrics,
  GP51DeviceData,
  GP51Group
} from '@/types/gp51-unified';

export class GP51DataService {
  // Helper method to determine if position is recent (online)
  private isPositionRecent(timestamp: number | string): boolean {
    let positionTime: Date;
    
    if (typeof timestamp === 'string') {
      positionTime = new Date(timestamp);
    } else {
      positionTime = new Date(timestamp * 1000); // Convert from seconds to milliseconds
    }
    
    const now = new Date();
    const diffMinutes = (now.getTime() - positionTime.getTime()) / (1000 * 60);
    return diffMinutes <= 10; // Consider online if position is within 10 minutes
  }

  // Helper method to determine if vehicle is moving
  private isVehicleMoving(speed: number): boolean {
    return speed > 5; // Consider moving if speed > 5 km/h
  }

  async queryMonitorList(): Promise<GP51ServiceResponse<GP51DeviceData[]>> {
    try {
      console.log('🔍 Querying monitor list from GP51 API...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        return {
          success: false,
          data: [],
          error: 'No valid session found'
        };
      }

      const response = await fetch('/functions/v1/gp51-query-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          username: session.username
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          data: [],
          error: data.error || 'Device query failed'
        };
      }

      // Transform data to match GP51DeviceData interface
      const deviceData: GP51DeviceData[] = (data.data || []).map((device: any) => ({
        deviceId: device.deviceId || device.id,
        deviceName: device.deviceName || device.name,
        deviceType: device.deviceType,
        simNumber: device.simNumber,
        groupId: device.groupId,
        groupName: device.groupName,
        isActive: device.isActive !== undefined ? device.isActive : true,
        lastActiveTime: device.lastActiveTime || new Date()
      }));

      return {
        success: true,
        data: deviceData,
        groups: data.groups,
        vehicles: deviceData
      };

    } catch (error) {
      console.error('Device query error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getPositions(): Promise<GP51Position[]> {
    try {
      console.log('📍 Fetching positions from GP51 API...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        return [];
      }

      const response = await fetch('/functions/v1/gp51-last-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          deviceIds: [],
          lastQueryTime: localStorage.getItem('gp51_last_query_time') || 0
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        console.error('Position query failed:', data.error);
        return [];
      }

      // Store last query time
      if (data.lastQueryTime) {
        localStorage.setItem('gp51_last_query_time', data.lastQueryTime.toString());
      }
      
      // Transform positions data with proper online and moving status
      const positions: GP51Position[] = (data.data || []).map((pos: any) => ({
        deviceId: pos.deviceId,
        latitude: pos.latitude || 0,
        longitude: pos.longitude || 0,
        timestamp: pos.timestamp,
        speed: pos.speed || 0,
        course: pos.course || 0,
        status: pos.status || 'unknown',
        isMoving: this.isVehicleMoving(pos.speed || 0),
        statusText: pos.statusText,
        address: pos.address,
        isOnline: this.isPositionRecent(pos.timestamp)
      }));
      
      return positions;

    } catch (error) {
      console.error('Position query error:', error);
      return [];
    }
  }

  async getLastPositions(): Promise<GP51Position[]> {
    // Alias for getPositions to maintain backwards compatibility
    return this.getPositions();
  }

  async testConnection(): Promise<GP51HealthStatus> {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('vehicles')
        .select('count')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      const isHealthy = !error;
      
      return {
        status: isHealthy ? 'healthy' : 'failed',
        lastCheck: new Date(),
        responseTime,
        isConnected: isHealthy,
        lastPingTime: new Date(),
        tokenValid: isHealthy,
        sessionValid: isHealthy,
        activeDevices: data?.length || 0,
        errorMessage: error?.message,
        errors: error ? [error.message] : undefined,
        // Required properties
        isHealthy,
        connectionStatus: error ? 'error' : 'connected'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      return {
        status: 'failed',
        lastCheck: new Date(),
        responseTime: 0,
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errorMessage,
        errors: [errorMessage],
        // Required properties
        isHealthy: false,
        connectionStatus: 'error'
      };
    }
  }

  async getLiveVehicles(): Promise<GP51ServiceResponse<GP51DeviceData[]>> {
    // Alias for queryMonitorList
    return this.queryMonitorList();
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51Position>> {
    try {
      const positions = await this.getPositions();
      const positionMap = new Map<string, GP51Position>();
      
      positions.forEach(position => {
        if (!deviceIds.length || deviceIds.includes(position.deviceId)) {
          positionMap.set(position.deviceId, position);
        }
      });
      
      return positionMap;
    } catch (error) {
      console.error('Error getting device positions:', error);
      return new Map();
    }
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    try {
      const startTime = Date.now();
      const [positions, devices] = await Promise.all([
        this.getPositions(),
        this.queryMonitorList()
      ]);
      
      const responseTime = Date.now() - startTime;
      const totalDevices = devices.data?.length || 0;
      const onlinePositions = positions.filter(p => p.isOnline);
      const activeDevices = onlinePositions.length;
      const movingVehicles = positions.filter(p => p.isMoving).length;
      const stoppedVehicles = onlinePositions.length - movingVehicles;

      return {
        responseTime,
        success: true,
        requestStartTime: new Date().toISOString(),
        deviceCount: totalDevices,
        groupCount: 0, // Could be enhanced with actual group count
        timestamp: new Date().toISOString(),
        apiCallCount: 2, // We made 2 API calls above
        errorRate: devices.success && positions.length >= 0 ? 0 : 0.1,
        averageResponseTime: responseTime,
        movingVehicles,
        stoppedVehicles,
        activeDevices,
        inactiveDevices: totalDevices - activeDevices,
        onlineDevices: activeDevices,
        offlineDevices: totalDevices - activeDevices
      };
    } catch (error) {
      return {
        responseTime: 0,
        success: false,
        requestStartTime: new Date().toISOString(),
        deviceCount: 0,
        groupCount: 0,
        timestamp: new Date().toISOString(),
        apiCallCount: 0,
        errorRate: 1,
        averageResponseTime: 0,
        movingVehicles: 0,
        stoppedVehicles: 0,
        activeDevices: 0,
        inactiveDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const gp51DataService = new GP51DataService();
export default GP51DataService;
