
import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51ApiResponse, 
  GP51ProcessedPosition, 
  GP51Device 
} from '@/types/gp51';

export class GP51DataService {
  private static instance: GP51DataService;

  private constructor() {}

  static getInstance(): GP51DataService {
    if (!GP51DataService.instance) {
      GP51DataService.instance = new GP51DataService();
    }
    return GP51DataService.instance;
  }

  async getDeviceList(): Promise<GP51ApiResponse<GP51Device[]>> {
    try {
      console.log('🚗 GP51DataService: Fetching device list via gp51-device-list...');
      
      const { data, error } = await supabase.functions.invoke('gp51-device-list');

      if (error) {
        console.error('❌ GP51DataService: Device list fetch failed:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ GP51DataService: GP51 API error:', data.error);
        return { success: false, error: data.error };
      }

      const devices: GP51Device[] = (data.devices || []).map((d: any) => ({
        deviceId: d.deviceId || d.deviceid,
        deviceName: d.deviceName || d.devicename,
        deviceType: d.deviceType || d.devicetype,
        groupId: d.groupId || d.groupid,
        isOnline: d.isOnline || false,
        lastUpdate: d.lastUpdate ? new Date(d.lastUpdate) : undefined
      }));

      console.log(`✅ GP51DataService: Retrieved ${devices.length} devices`);
      
      return { success: true, data: devices };
    } catch (error) {
      console.error('❌ GP51DataService: Device list exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch device list' 
      };
    }
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51ProcessedPosition>> {
    const positionsMap = new Map<string, GP51ProcessedPosition>();
    try {
      if (deviceIds.length === 0) {
        console.log('🗺️ GP51DataService: No device IDs provided for position fetch. Skipping.');
        return positionsMap;
      }

      console.log(`🗺️ GP51DataService: Fetching positions for ${deviceIds.length} devices...`);
      
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: { 
          deviceids: deviceIds.join(',')
        }
      });

      if (error) {
        console.error('❌ GP51DataService: Positions fetch failed:', error);
        return positionsMap;
      }

      if (!data.success) {
        console.error('❌ GP51DataService: GP51 positions API error:', data.error);
        return positionsMap;
      }

      const positions: any[] = data.telemetry || [];
      console.log(`✅ GP51DataService: Retrieved positions for ${positions.length} devices`);
      
      positions.forEach(pos => {
        if (pos.deviceId) {
          positionsMap.set(pos.deviceId, {
            ...pos,
            timestamp: new Date(pos.timestamp) // Convert string to Date for type consistency
          });
        }
      });

    } catch (error) {
      console.error('❌ GP51DataService: Positions exception:', error);
    }
    return positionsMap;
  }
  
  // Stub for backward compatibility with read-only components
  async getLiveVehicles(): Promise<any> {
      console.warn('GP51DataService.getLiveVehicles is deprecated and should not be used.');
      return { success: true, data: { devices: [], telemetry: [] } };
  }

  // Stub for backward compatibility with read-only components
  async processVehicleData(): Promise<any> {
      console.warn('GP51DataService.processVehicleData is deprecated and should not be used.');
      return { success: true, created: 0, updated: 0, errors: [] };
  }
}

// Export singleton instance
export const gp51DataService = GP51DataService.getInstance();

// Export types for backward compatibility
export type { GP51ProcessedPosition } from '@/types/gp51';
