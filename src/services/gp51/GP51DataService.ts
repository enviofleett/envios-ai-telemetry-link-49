
import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51ApiResponse, 
  GP51ProcessedPosition, 
  GP51Device, 
  GP51DeviceListResponse,
  GP51PositionsResponse,
  GP51LiveVehiclesResponse,
  ProcessVehicleDataResult,
  LiveVehicleFilterConfig
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
      console.log('🚗 GP51DataService: Fetching device list...');
      
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: { action: 'querymonitorlist' }
      });

      if (error) {
        console.error('❌ GP51DataService: Device list fetch failed:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ GP51DataService: GP51 API error:', data.error);
        return { success: false, error: data.error };
      }

      const devices: GP51Device[] = data.data?.devices || [];
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
    try {
      console.log(`🗺️ GP51DataService: Fetching positions for ${deviceIds.length} devices...`);
      
      const positionMap = new Map<string, GP51ProcessedPosition>();
      
      if (deviceIds.length === 0) {
        return positionMap;
      }

      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: { 
          action: 'lastposition',
          deviceids: deviceIds.join(',')
        }
      });

      if (error) {
        console.error('❌ GP51DataService: Positions fetch failed:', error);
        throw new Error(error.message);
      }

      if (!data.success) {
        console.error('❌ GP51DataService: GP51 positions API error:', data.error);
        throw new Error(data.error);
      }

      const positions: GP51ProcessedPosition[] = data.data?.telemetry || [];
      
      positions.forEach(position => {
        positionMap.set(position.deviceId, position);
      });

      console.log(`✅ GP51DataService: Retrieved positions for ${positionMap.size} devices`);
      return positionMap;
    } catch (error) {
      console.error('❌ GP51DataService: Positions exception:', error);
      throw error;
    }
  }

  async getLiveVehicles(config?: LiveVehicleFilterConfig): Promise<GP51ApiResponse<GP51LiveVehiclesResponse>> {
    try {
      console.log('🔄 GP51DataService: Fetching live vehicles data...');
      
      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: { 
          action: 'getlivedata',
          config: config || {}
        }
      });

      if (error) {
        console.error('❌ GP51DataService: Live vehicles fetch failed:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ GP51DataService: GP51 live data API error:', data.error);
        return { success: false, error: data.error };
      }

      console.log(`✅ GP51DataService: Retrieved live data - ${data.data?.total_devices || 0} devices, ${data.data?.total_positions || 0} positions`);
      
      return { success: true, data: data.data };
    } catch (error) {
      console.error('❌ GP51DataService: Live vehicles exception:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch live vehicles' 
      };
    }
  }

  async processVehicleData(
    devices: GP51Device[], 
    positions: GP51ProcessedPosition[]
  ): Promise<ProcessVehicleDataResult> {
    try {
      console.log(`🔄 GP51DataService: Processing ${devices.length} devices and ${positions.length} positions...`);
      
      const result: ProcessVehicleDataResult = {
        processed: 0,
        created: 0,
        updated: 0,
        errors: []
      };

      // Create a map of positions by device ID for quick lookup
      const positionMap = new Map<string, GP51ProcessedPosition>();
      positions.forEach(pos => positionMap.set(pos.deviceId, pos));

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Process each device
      for (const device of devices) {
        try {
          const position = positionMap.get(device.deviceId);
          
          // Prepare vehicle data
          const vehicleData = {
            device_id: device.deviceId,
            device_name: device.deviceName || device.deviceId,
            envio_user_id: user.id,
            is_active: true,
            gp51_metadata: {
              latitude: position?.latitude || 0,
              longitude: position?.longitude || 0,
              speed: position?.speed || 0,
              course: position?.course || 0,
              status: position?.status || 'unknown',
              statusText: position?.statusText || 'No data',
              timestamp: position?.timestamp?.toISOString() || new Date().toISOString(),
              isMoving: position?.isMoving || false,
              vehicleStatus: position?.isOnline ? 'online' : 'offline',
              lastGP51Sync: new Date().toISOString(),
              importSource: 'gp51_live'
            } as const
          };

          // Upsert vehicle data
          const { data: vehicleResult, error: vehicleError } = await supabase
            .from('vehicles')
            .upsert(vehicleData, {
              onConflict: 'device_id',
              ignoreDuplicates: false
            })
            .select('id, created_at')
            .single();

          if (vehicleError) {
            result.errors.push(`Vehicle ${device.deviceId}: ${vehicleError.message}`);
            continue;
          }

          // Check if this was a new record
          const wasCreated = vehicleResult && new Date(vehicleResult.created_at).getTime() > (Date.now() - 5000);
          if (wasCreated) {
            result.created++;
          } else {
            result.updated++;
          }

          result.processed++;

        } catch (deviceError) {
          const errorMessage = deviceError instanceof Error ? deviceError.message : 'Unknown error';
          result.errors.push(`Device ${device.deviceId}: ${errorMessage}`);
        }
      }

      console.log(`✅ GP51DataService: Processing complete - ${result.processed} processed, ${result.created} created, ${result.updated} updated, ${result.errors.length} errors`);
      
      if (result.errors.length > 0) {
        console.warn('⚠️ GP51DataService: Processing errors:', result.errors);
      }

      return result;
    } catch (error) {
      console.error('❌ GP51DataService: Process vehicle data exception:', error);
      throw error;
    }
  }

  // Legacy compatibility method
  static async fetchData() {
    try {
      const instance = GP51DataService.getInstance();
      const result = await instance.getLiveVehicles();
      
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error || 'Failed to fetch GP51 data');
      }
    } catch (error) {
      console.error('❌ GP51 data fetch failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const gp51DataService = GP51DataService.getInstance();

// Export types for backward compatibility
export type { GP51ProcessedPosition, LiveVehicleFilterConfig } from '@/types/gp51';
