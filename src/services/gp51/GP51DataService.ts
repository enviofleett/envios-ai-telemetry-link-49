
import { supabase } from '@/integrations/supabase/client';
import { GP51DeviceData, GP51Position, GP51Group } from '@/types/gp51-unified';

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
        body: { action: 'querymonitorlist' }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('📊 Monitor list response:', data);

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to query monitor list',
          data: [],
          groups: []
        };
      }

      const groups = data?.groups || [];
      const devices = data?.devices || groups.flatMap((group: any) => group.devices || []);

      console.log('✅ Successfully fetched:', {
        groupCount: groups.length,
        deviceCount: devices.length
      });

      return {
        success: true,
        data: devices,
        groups: groups
      };
    } catch (error) {
      console.error('Failed to query monitor list:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        groups: []
      };
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      console.log('📍 Getting positions for devices:', deviceIds);
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'getpositions',
          deviceIds: deviceIds 
        }
      });

      if (error) throw error;

      return data?.positions || [];
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    return this.getPositions(deviceIds);
  }

  async getDevices(deviceIds?: string[]) {
    const result = await this.queryMonitorList();
    
    return {
      success: result.success,
      data: result.data || [],
      groups: result.groups || [],
      error: result.error
    };
  }

  /**
   * Get live vehicles data (used by GPS51Dashboard and GP51ImportModal)
   */
  async getLiveVehicles(): Promise<{
    success: boolean;
    data?: any[];
    vehicles?: any[];
    error?: string;
  }> {
    try {
      console.log('🚗 Fetching live vehicles...');
      
      const result = await this.queryMonitorList();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch live vehicles');
      }

      console.log('✅ Live vehicles loaded:', {
        deviceCount: result.data?.length || 0,
        groupCount: result.groups?.length || 0
      });
      
      return {
        success: true,
        data: result.data || [],
        vehicles: result.data || []
      };

    } catch (error) {
      console.error('❌ Live vehicles error:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        vehicles: []
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
   * Get performance metrics (used by GP51PerformanceMonitor)
   */
  async getPerformanceMetrics(): Promise<{
    success: boolean;
    metrics?: any;
    error?: string;
  }> {
    try {
      console.log('📈 Fetching performance metrics...');
      
      const deviceResponse = await this.getLiveVehicles();
      
      if (!deviceResponse.success) {
        throw new Error('Failed to fetch device data for metrics');
      }

      const devices = deviceResponse.data || [];
      
      // Calculate performance metrics
      const totalDevices = devices.length;
      const activeDevices = devices.filter((d: any) => d.isActive).length;
      const onlineDevices = devices.filter((d: any) => d.status === 'online').length;
      const offlineDevices = totalDevices - onlineDevices;
      
      // Response time calculation (mock for now, could be enhanced)
      const avgResponseTime = Math.random() * 1000 + 500; // 500-1500ms
      
      const metrics = {
        totalDevices,
        activeDevices,
        inactiveDevices: totalDevices - activeDevices,
        onlineDevices,
        offlineDevices,
        connectionHealth: totalDevices > 0 ? onlineDevices / totalDevices : 0,
        averageResponseTime: avgResponseTime,
        dataFreshness: new Date().toISOString(),
        systemStatus: totalDevices > 0 && onlineDevices > totalDevices * 0.8 ? 'healthy' : 'degraded'
      };

      console.log('✅ Performance metrics calculated:', metrics);
      
      return {
        success: true,
        metrics
      };

    } catch (error) {
      console.error('❌ Performance metrics error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get multiple devices last positions (used by services)
   */
  async getMultipleDevicesLastPositions(deviceIds: string[] = []): Promise<{
    success: boolean;
    positions?: any[];
    error?: string;
  }> {
    try {
      console.log('📍 Fetching last positions for devices:', deviceIds.length || 'all');
      
      const positions = await this.getPositions(deviceIds);
      
      console.log('✅ Positions loaded:', positions.length);
      
      return {
        success: true,
        positions: positions
      };

    } catch (error) {
      console.error('❌ Position fetch error:', error);
      return {
        success: false,
        error: error.message,
        positions: []
      };
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
      const positions = positionResponse.positions || [];
      
      const totalDevices = devices.length;
      const activeDevices = devices.filter((d: any) => d.isActive).length;
      const onlineDevices = positions.filter((p: any) => p.status === 'online').length;
      
      return {
        totalDevices,
        activeDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        groups: new Set(devices.map((d: any) => d.groupId)).size,
        connectionStatus: totalDevices > 0 && onlineDevices > totalDevices * 0.8 ? 'healthy' : 'degraded'
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
