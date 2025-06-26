
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
}
