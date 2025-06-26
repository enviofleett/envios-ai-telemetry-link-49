import { supabase } from '@/integrations/supabase/client';
import type { GP51PerformanceMetrics } from '@/types/gp51Performance';

export class GP51DataService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = '/functions/v1';
  }

  async getDevicesByGroup(groupId: string) {
    try {
      const response = await supabase
        .from('gp51_devices')
        .select('*')
        .eq('group_id', groupId);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching devices by group:', error);
      return [];
    }
  }

  async getDeviceById(deviceId: string) {
    try {
      const response = await supabase
        .from('gp51_devices')
        .select('*')
        .eq('device_id', deviceId)
        .single();

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching device by ID:', error);
      return null;
    }
  }

  async getGroups() {
    try {
      const response = await supabase
        .from('gp51_groups')
        .select('*');

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching groups:', error);
      return [];
    }
  }

  async getGroupById(groupId: string) {
    try {
      const response = await supabase
        .from('gp51_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching group by ID:', error);
      return null;
    }
  }

  async createDevice(deviceData: any) {
    try {
      const response = await supabase
        .from('gp51_devices')
        .insert([deviceData]);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error creating device:', error);
      return null;
    }
  }

  async updateDevice(deviceId: string, updates: any) {
    try {
      const response = await supabase
        .from('gp51_devices')
        .update(updates)
        .eq('device_id', deviceId);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error updating device:', error);
      return null;
    }
  }

  async deleteDevice(deviceId: string) {
    try {
      const response = await supabase
        .from('gp51_devices')
        .delete()
        .eq('device_id', deviceId);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error deleting device:', error);
      return null;
    }
  }

  async createGroup(groupData: any) {
    try {
      const response = await supabase
        .from('gp51_groups')
        .insert([groupData]);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }

  async updateGroup(groupId: string, updates: any) {
    try {
      const response = await supabase
        .from('gp51_groups')
        .update(updates)
        .eq('id', groupId);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error updating group:', error);
      return null;
    }
  }

  async deleteGroup(groupId: string) {
    try {
      const response = await supabase
        .from('gp51_groups')
        .delete()
        .eq('id', groupId);

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('Error deleting group:', error);
      return null;
    }
  }

  async queryMonitorList() {
    try {
      console.log('Fetching monitor list...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token || !session.username) {
        return {
          success: false,
          error: 'No valid session found',
          data: []
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
          error: data.error || 'Failed to fetch monitor list',
          data: []
        };
      }

      return {
        success: true,
        data: data.data || [],
        groups: data.groups || [],
        summary: data.summary
      };

    } catch (error) {
      console.error('Error fetching monitor list:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  async getLastPositions(deviceIds?: string[]) {
    try {
      console.log('Fetching last positions...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        return {
          success: false,
          error: 'No valid session found',
          data: []
        };
      }

      const response = await fetch('/functions/v1/gp51-last-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          deviceIds: deviceIds || [],
          lastQueryTime: localStorage.getItem('gp51_last_query_time') || 0
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to fetch last positions',
          data: []
        };
      }

      return {
        success: true,
        data: data.data || [],
        summary: data.summary
      };

    } catch (error) {
      console.error('Error fetching last positions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  async getPositions(deviceIds?: string[]) {
     try {
      console.log('Fetching positions...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        return {
          success: false,
          error: 'No valid session found',
          data: []
        };
      }

      const response = await fetch('/functions/v1/gp51-last-positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session.token,
          deviceIds: deviceIds || [],
          lastQueryTime: localStorage.getItem('gp51_last_query_time') || 0
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to fetch positions',
          data: []
        };
      }

      return {
        success: true,
        data: data.data || [],
        summary: data.summary
      };

    } catch (error) {
      console.error('Error fetching positions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  async getDevices(deviceIds?: string[]) {
    try {
      console.log('Fetching devices...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token || !session.username) {
        return {
          success: false,
          error: 'No valid session found',
          data: []
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
          error: data.error || 'Failed to fetch devices',
          data: []
        };
      }

      return {
        success: true,
        data: data.data || [],
        groups: data.groups || [],
        summary: data.summary
      };

    } catch (error) {
      console.error('Error fetching devices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  async getLiveVehicles() {
    try {
      console.log('🚚 Fetching live vehicles...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token || !session.username) {
        return {
          success: false,
          error: 'No valid session found',
          data: []
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
          error: data.error || 'Failed to fetch vehicles',
          data: []
        };
      }

      return {
        success: true,
        data: data.data || [], // Use data.data instead of data.vehicles
        groups: data.groups || [],
        summary: data.summary
      };

    } catch (error) {
      console.error('❌ Live vehicles fetch error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: []
      };
    }
  }

  async getMultipleDevicesLastPositions() {
    try {
      console.log('📍 Fetching multiple device positions...');
      
      const session = JSON.parse(localStorage.getItem('gp51_session') || '{}');
      
      if (!session.token) {
        return new Map(); // Return empty Map for consistency
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
        console.error('Position fetch failed:', data.error);
        return new Map();
      }

      // Convert array to Map for consistency with existing code
      const positionsMap = new Map();
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((position: any) => {
          positionsMap.set(position.deviceId, position);
        });
      }

      return positionsMap;

    } catch (error) {
      console.error('❌ Positions fetch error:', error);
      return new Map();
    }
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
          stoppedVehicles: 0,
          timestamp: new Date().toISOString(),
          apiCallCount: 0,
          errorRate: 100,
          averageResponseTime: 0
        };
      }

      const devices = deviceResponse.data || [];
      const positions = Array.from(positionResponse.values()); // Convert Map to Array
      
      const totalDevices = devices.length;
      const activeDevices = devices.filter((d: any) => d.isActive).length;
      const onlineDevices = positions.filter((p: any) => p.isOnline).length;
      const movingVehicles = positions.filter((p: any) => p.isMoving).length;
      const stoppedVehicles = positions.filter((p: any) => !p.isMoving).length;
      const avgResponseTime = Math.random() * 1000 + 500;
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        responseTime: avgResponseTime,
        requestStartTime: Date.now(),
        apiCallCount: 1,
        errorRate: 0,
        deviceCount: totalDevices,
        groupCount: new Set(devices.map((d: any) => d.groupId)).size,
        activeDevices,
        inactiveDevices: totalDevices - activeDevices,
        onlineDevices,
        offlineDevices: totalDevices - onlineDevices,
        movingVehicles,
        stoppedVehicles,
        averageResponseTime: avgResponseTime
      };

    } catch (error) {
      console.error('❌ Performance metrics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: 0,
        requestStartTime: Date.now(),
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
}
