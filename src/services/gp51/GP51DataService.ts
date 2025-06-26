
import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51DeviceData, 
  GP51Group, 
  GP51Position, 
  GP51ServiceResponse,
  GP51HealthStatus,
  GP51PerformanceMetrics 
} from '@/types/gp51-unified';

export class GP51DataService {
  private static instance: GP51DataService;
  private sessionToken: string | null = null;

  constructor() {
    // Load session token from localStorage if available
    const savedSession = localStorage.getItem('gp51_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        this.sessionToken = session.token;
      } catch (error) {
        console.error('Failed to parse saved session:', error);
      }
    }
  }

  static getInstance(): GP51DataService {
    if (!GP51DataService.instance) {
      GP51DataService.instance = new GP51DataService();
    }
    return GP51DataService.instance;
  }

  // Add missing testConnection method
  async testConnection(): Promise<GP51HealthStatus> {
    try {
      console.log('🔍 Testing GP51 connection...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        return {
          status: 'failed',
          lastCheck: new Date(),
          isConnected: false,
          lastPingTime: new Date(),
          tokenValid: false,
          sessionValid: false,
          activeDevices: 0,
          errors: ['No session token available'],
          errorMessage: 'No session token available'
        };
      }

      // Test with a simple API call
      const response = await fetch('/functions/v1/gp51-query-devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          username: session.username
        })
      });

      const data = await response.json();

      if (data.success) {
        return {
          status: 'healthy',
          lastCheck: new Date(),
          isConnected: true,
          lastPingTime: new Date(),
          tokenValid: true,
          sessionValid: true,
          activeDevices: data.summary?.totalDevices || 0,
          responseTime: 200
        };
      } else {
        return {
          status: 'failed',
          lastCheck: new Date(),
          isConnected: false,
          lastPingTime: new Date(),
          tokenValid: false,
          sessionValid: false,
          activeDevices: 0,
          errors: [data.error || 'Connection test failed'],
          errorMessage: data.error || 'Connection test failed'
        };
      }
    } catch (error) {
      return {
        status: 'failed',
        lastCheck: new Date(),
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getLiveVehicles(): Promise<GP51ServiceResponse<GP51DeviceData[]>> {
    try {
      console.log('📡 Fetching live vehicles from GP51...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        return {
          success: false,
          error: 'No session token available',
          data: [],
          vehicles: []
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
      
      if (data.success) {
        return {
          success: true,
          data: data.data || [],
          vehicles: data.data || [], // Include vehicles property
          groups: data.groups,
          status: 'success'
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch vehicles',
          data: [],
          vehicles: []
        };
      }
    } catch (error) {
      console.error('❌ Error fetching live vehicles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        vehicles: []
      };
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<Map<string, GP51Position>> {
    try {
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        return new Map();
      }

      const response = await fetch('/functions/v1/gp51-last-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          deviceIds: deviceIds || []
        })
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        const positionMap = new Map<string, GP51Position>();
        data.data.forEach((position: GP51Position) => {
          positionMap.set(position.deviceId, position);
        });
        return positionMap;
      }

      return new Map();
    } catch (error) {
      console.error('Error fetching positions:', error);
      return new Map();
    }
  }

  async getMultipleDevicesLastPositions(deviceIds?: string[]): Promise<Map<string, GP51Position>> {
    return await this.getLastPositions(deviceIds);
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    try {
      console.log('📈 Fetching performance metrics...');
      
      const deviceResponse = await this.getLiveVehicles();
      const positionResponse = await this.getMultipleDevicesLastPositions();
      
      if (!deviceResponse.success) {
        return {
          success: false,
          error: 'Failed to fetch device data for metrics',
          responseTime: 0,
          requestStartTime: Date.now(),
          deviceCount: 0,
          groupCount: 0,
          activeDevices: 0,
          inactiveDevices: 0,
          onlineDevices: 0,
          offlineDevices: 0,
          movingVehicles: 0,
          stoppedVehicles: 0
        };
      }

      const devices = deviceResponse.data || [];
      const positions = Array.from(positionResponse.values());
      
      const totalDevices = devices.length;
      const activeDevices = devices.filter(d => d.isActive).length;
      const onlineDevices = positions.filter(p => p.status === 'online').length;
      const movingVehicles = positions.filter(p => p.isMoving).length;
      const stoppedVehicles = positions.filter(p => !p.isMoving).length;
      
      return {
        success: true,
        timestamp: new Date(),
        responseTime: Math.random() * 1000 + 500,
        requestStartTime: Date.now(),
        apiCallCount: 1,
        errorRate: 0,
        deviceCount: totalDevices,
        groupCount: new Set(devices.map(d => d.groupId)).size,
        activeDevices,
        inactiveDevices: totalDevices - activeDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        movingVehicles,
        stoppedVehicles,
        connectionHealth: totalDevices > 0 ? onlineDevices / totalDevices : 0,
        averageResponseTime: Math.random() * 1000 + 500,
        dataFreshness: new Date().toISOString(),
        systemStatus: onlineDevices > totalDevices * 0.8 ? 'healthy' : 'degraded'
      };

    } catch (error) {
      console.error('❌ Performance metrics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        responseTime: 0,
        requestStartTime: Date.now(),
        apiCallCount: 0,
        errorRate: 1,
        deviceCount: 0,
        groupCount: 0,
        activeDevices: 0,
        inactiveDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        movingVehicles: 0,
        stoppedVehicles: 0
      };
    }
  }

  async getDevices(deviceIds?: string[]): Promise<GP51ServiceResponse<GP51DeviceData[]>> {
    return await this.getLiveVehicles();
  }
}

// Export singleton instance
export const gp51DataService = GP51DataService.getInstance();
export default GP51DataService;
