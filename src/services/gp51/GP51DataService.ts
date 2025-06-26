
import { supabase } from '@/integrations/supabase/client';
import { GP51DeviceData, GP51Position, GP51Group, GP51ServiceResponse } from '@/types/gp51-unified';

export class GP51DataService {
  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51DeviceData[];
    groups?: GP51Group[];
    error?: string;
  }> {
    try {
      console.log('🔍 Querying monitor list...');
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'query_devices' }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to query devices');
      }
      
      return {
        success: true,
        data: data.data || [],
        groups: data.groups || []
      };
    } catch (error) {
      console.error('❌ Query monitor list error:', error);
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
      console.log('📍 Fetching last positions...');
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'get_positions',
          deviceIds: deviceIds 
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data?.positions || [];
    } catch (error) {
      console.error('❌ Get last positions error:', error);
      return [];
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    return this.getLastPositions(deviceIds);
  }

  async getDevices(deviceIds?: string[]) {
    try {
      const result = await this.queryMonitorList();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      let devices = result.data || [];
      
      if (deviceIds && deviceIds.length > 0) {
        devices = devices.filter(device => deviceIds.includes(device.deviceId));
      }
      
      return {
        success: true,
        data: devices,
        groups: result.groups || []
      };
    } catch (error) {
      console.error('❌ Get devices error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        groups: []
      };
    }
  }

  /**
   * Get live vehicles data (used by GPS51Dashboard and GP51ImportModal)
   */
  async getLiveVehicles(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      console.log('🚗 Fetching live vehicles...');
      
      const result = await this.queryMonitorList();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch live vehicles');
      }

      console.log('✅ Live vehicles loaded:', result.data?.length || 0);
      
      return {
        success: true,
        data: result.data || []
      };

    } catch (error) {
      console.error('❌ Live vehicles error:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  /**
   * Get data directly (used by GP51HistoricalData)
   */
  async getDataDirectly(): Promise<{
    success: boolean;
    data?: any[];
    groups?: any[];
    error?: string;
  }> {
    try {
      console.log('📊 Fetching data directly...');
      
      const result = await this.queryMonitorList();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      return {
        success: true,
        data: result.data || [],
        groups: result.groups || []
      };

    } catch (error) {
      console.error('❌ Direct data fetch error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        groups: []
      };
    }
  }

  /**
   * Get performance metrics - Return proper GP51PerformanceMetrics structure
   */
  async getPerformanceMetrics(): Promise<import('@/types/gp51Performance').GP51PerformanceMetrics> {
    try {
      console.log('📈 Fetching performance metrics...');
      
      const deviceResponse = await this.getLiveVehicles();
      const startTime = Date.now();
      
      const devices = deviceResponse.data || [];
      const totalDevices = devices.length;
      const activeDevices = devices.filter(d => d.isActive).length;
      const onlineDevices = devices.filter(d => d.status === 'online').length;
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      const metrics = {
        responseTime,
        success: deviceResponse.success,
        requestStartTime: new Date(startTime).toISOString(),
        errorType: deviceResponse.error,
        deviceCount: totalDevices,
        groupCount: 0, // Will be calculated from groups if available
        timestamp: new Date().toISOString(),
        apiCallCount: 1,
        errorRate: deviceResponse.success ? 0 : 100,
        averageResponseTime: responseTime
      };

      console.log('✅ Performance metrics calculated:', metrics);
      
      return metrics;

    } catch (error) {
      console.error('❌ Performance metrics error:', error);
      return {
        responseTime: 0,
        success: false,
        requestStartTime: new Date().toISOString(),
        errorType: error.message,
        deviceCount: 0,
        groupCount: 0,
        timestamp: new Date().toISOString(),
        apiCallCount: 1,
        errorRate: 100,
        averageResponseTime: 0
      };
    }
  }

  /**
   * Get multiple devices last positions - Return Map for compatibility
   */
  async getMultipleDevicesLastPositions(deviceIds: string[] = []): Promise<Map<string, any>> {
    try {
      console.log('📍 Fetching last positions for devices:', deviceIds.length || 'all');
      
      const positions = await this.getLastPositions(deviceIds);
      
      // Convert array to Map for compatibility with existing code
      const positionMap = new Map();
      
      positions.forEach(position => {
        if (position.deviceId) {
          positionMap.set(position.deviceId, position);
        }
      });

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
      const [deviceResponse, positionMap] = await Promise.all([
        this.getLiveVehicles(),
        this.getMultipleDevicesLastPositions()
      ]);

      const devices = deviceResponse.data || [];
      
      const totalDevices = devices.length;
      const activeDevices = devices.filter(d => d.isActive).length;
      const onlineDevices = Array.from(positionMap.values()).filter(p => p.isOnline).length;
      
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

// Create and export singleton instance
export const gp51DataService = new GP51DataService();

// Also export the class
export { GP51DataService };
export default GP51DataService;
