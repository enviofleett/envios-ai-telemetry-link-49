import { supabase } from '@/integrations/supabase/client';
import { GP51DeviceData, GP51Position, GP51Group } from '@/types/gp51-unified';

class GP51DataService {
  private baseUrl = 'https://www.gps51.com/webapi';

  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51DeviceData[];
    groups?: GP51Group[];
    error?: string;
  }> {
    try {
      console.log('🔍 Querying GP51 monitor list...');
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'query_monitor_list' }
      });
      
      if (error || !data?.success) {
        return {
          success: false,
          error: error?.message || 'Failed to query monitor list',
          data: [],
          groups: []
        };
      }
      
      return {
        success: true,
        data: data.data || [],
        groups: data.groups || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        groups: []
      };
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      console.log('📍 Getting last positions...');
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'get_last_positions',
          deviceIds: deviceIds 
        }
      });
      
      if (error || !data?.success) {
        console.error('❌ Failed to get positions:', error);
        return [];
      }
      
      return data.positions || [];
    } catch (error) {
      console.error('❌ Position fetch error:', error);
      return [];
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      console.log('📍 Getting positions...');
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'get_positions',
          deviceIds: deviceIds 
        }
      });
      
      if (error || !data?.success) {
        console.error('❌ Failed to get positions:', error);
        return [];
      }
      
      return data.positions || [];
    } catch (error) {
      console.error('❌ Position fetch error:', error);
      return [];
    }
  }

  async getDevices(deviceIds?: string[]) {
    try {
      console.log('🚗 Getting devices...');
      
      const result = await this.queryMonitorList();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          data: []
        };
      }
      
      let devices = result.data || [];
      
      if (deviceIds && deviceIds.length > 0) {
        devices = devices.filter(device => deviceIds.includes(device.deviceId));
      }
      
      return {
        success: true,
        data: devices,
        groups: result.groups
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get live vehicles data (used by GPS51Dashboard and GP51ImportModal)
   */
  async getLiveVehicles() {
    try {
      console.log('🚗 Fetching live vehicles from GP51...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token || !session.username) {
        return {
          success: false,
          error: 'No valid session found',
          data: []
        };
      }

      // Use the new device query endpoint
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
        throw new Error(data.error || 'Failed to fetch devices');
      }

      console.log('✅ Live vehicles loaded:', data.summary);
      
      return {
        success: true,
        data: data.data || [],
        groups: data.groups || [],
        summary: data.summary
      };

    } catch (error) {
      console.error('❌ Live vehicles error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch vehicles',
        data: []
      };
    }
  }

  /**
   * Get data directly (used by GP51HistoricalData)
   */
  async getDataDirectly() {
    try {
      console.log('📊 Getting GP51 data directly...');
      
      const vehicleResponse = await this.getLiveVehicles();
      
      if (!vehicleResponse.success) {
        return {
          success: false,
          error: vehicleResponse.error,
          data: []
        };
      }

      console.log('✅ Direct data fetch completed');
      
      return {
        success: true,
        data: vehicleResponse.data,
        groups: vehicleResponse.groups,
        summary: vehicleResponse.summary
      };

    } catch (error) {
      console.error('❌ Direct data fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Direct data fetch failed',
        data: []
      };
    }
  }

  /**
   * Get performance metrics (used by GP51PerformanceMonitor)
   */
  async getPerformanceMetrics(): Promise<any> {
    try {
      console.log('📈 Fetching performance metrics...');
      
      const startTime = Date.now();
      const deviceResponse = await this.getLiveVehicles();
      const positionResponse = await this.getMultipleDevicesLastPositions();
      const responseTime = Date.now() - startTime;
      
      if (!deviceResponse.success) {
        return {
          success: false,
          error: 'Failed to fetch device data for metrics',
          responseTime,
          requestStartTime: startTime.toString(),
          deviceCount: 0,
          groupCount: 0,
          activeDevices: 0,
          inactiveDevices: 0,
          onlineDevices: 0,
          offlineDevices: 0,
          movingVehicles: 0,
          stoppedVehicles: 0,
          timestamp: new Date().toISOString(),
          apiCallCount: 1,
          errorRate: 100,
          averageResponseTime: responseTime
        };
      }

      const devices = deviceResponse.vehicles || [];
      const positions = Array.isArray(positionResponse) ? positionResponse : Array.from(positionResponse.values());
      
      const totalDevices = devices.length;
      const activeDevices = devices.filter(d => d.isActive).length;
      const onlineDevices = positions.filter(p => p.isOnline).length;
      const offlineDevices = positions.filter(p => !p.isOnline).length;
      const movingVehicles = positions.filter(p => p.isMoving).length;
      const stoppedVehicles = positions.filter(p => !p.isMoving).length;
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        responseTime,
        requestStartTime: startTime.toString(),
        apiCallCount: 2,
        errorRate: 0,
        deviceCount: totalDevices,
        groupCount: new Set(devices.map(d => d.groupId)).size,
        activeDevices,
        inactiveDevices: totalDevices - activeDevices,
        onlineDevices,
        offlineDevices,
        movingVehicles,
        stoppedVehicles,
        averageResponseTime: responseTime
      };

    } catch (error) {
      console.error('❌ Performance metrics error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        responseTime: 0,
        requestStartTime: Date.now().toString(),
        apiCallCount: 0,
        errorRate: 100,
        deviceCount: 0,
        groupCount: 0,
        activeDevices: 0,
        inactiveDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        movingVehicles: 0,
        stoppedVehicles: 0,
        averageResponseTime: 0
      };
    }
  }

  /**
   * Get multiple devices last positions - Return Map-like structure
   */
  async getMultipleDevicesLastPositions(deviceIds: string[] = []): Promise<Map<string, any>> {
    try {
      console.log('📍 Fetching last positions for devices:', deviceIds.length || 'all');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        throw new Error('No valid session found');
      }

      const response = await fetch('/functions/v1/gp51-last-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          deviceIds: deviceIds,
          lastQueryTime: localStorage.getItem('gp51_last_query_time') || '0'
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch positions');
      }

      // Store last query time
      if (data.lastQueryTime) {
        localStorage.setItem('gp51_last_query_time', data.lastQueryTime.toString());
      }

      // Convert array to Map for compatibility with existing code
      const positionMap = new Map();
      
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach(position => {
          if (position.deviceId) {
            positionMap.set(position.deviceId, position);
          }
        });
      }

      console.log('✅ Positions loaded as Map:', positionMap.size, 'devices');
      
      return positionMap;

    } catch (error) {
      console.error('❌ Position fetch error:', error);
      return new Map(); // Return empty Map on error
    }
  }

  /**
   * Get dashboard summary data
   */
  async getDashboardSummary(): Promise<{
    totalDevices: number;
    activeDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    groups: number;
    connectionStatus: string;
  }> {
    try {
      const [deviceResponse, positionResponse] = await Promise.all([
        this.getLiveVehicles(),
        this.getMultipleDevicesLastPositions()
      ]);

      const devices = deviceResponse.data || [];
      const positions = positionResponse || new Map();
      
      const totalDevices = devices.length;
      const activeDevices = devices.filter(d => d.isActive).length;
      const onlineDevices = Array.from(positions.values()).filter(p => p.isOnline).length;
      
      return {
        totalDevices,
        activeDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        groups: new Set(devices.map(d => d.groupId)).size,
        connectionStatus: onlineDevices > totalDevices * 0.8 ? 'healthy' : 'degraded'
      };

    } catch (error) {
      console.error('❌ Dashboard summary error:', error);
      return {
        totalDevices: 0,
        activeDevices: 0,
        onlineDevices: 0,
        offlineDevices: 0,
        groups: 0,
        connectionStatus: 'error'
      };
    }
  }
}

export { GP51DataService };
export const gp51DataService = new GP51DataService();
export default GP51DataService;
