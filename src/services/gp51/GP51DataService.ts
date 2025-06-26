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
  // Add missing queryMonitorList method
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

      return {
        success: true,
        data: data.data || [],
        groups: data.groups,
        vehicles: data.data || []
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

  // Add missing getPositions method
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
      
      return data.data || [];

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
        .from('gp51_vehicles')
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
      const positions = await this.getPositions();
      const devices = await this.queryMonitorList();
      
      const totalDevices = devices.data?.length || 0;
      const activeDevices = positions.filter(p => 
        p.isOnline !== undefined ? p.isOnline : this.isPositionRecent(p.timestamp)
      ).length;

      return {
        responseTime: 150,
        success: true,
        requestStartTime: new Date().toISOString(),
        deviceCount: totalDevices,
        groupCount: 0,
        timestamp: new Date().toISOString(),
        apiCallCount: 1,
        errorRate: 0,
        averageResponseTime: 150,
        movingVehicles: positions.filter(p => p.isMoving).length,
        stoppedVehicles: positions.filter(p => !p.isMoving).length,
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

  // Helper method to determine if position is recent (online)
  private isPositionRecent(timestamp: number): boolean {
    const positionTime = new Date(timestamp * 1000); // Convert from seconds to milliseconds
    const now = new Date();
    const diffMinutes = (now.getTime() - positionTime.getTime()) / (1000 * 60);
    return diffMinutes <= 10; // Consider online if position is within 10 minutes
  }
}

// Export singleton instance
export const gp51DataService = new GP51DataService();
export default GP51DataService;
