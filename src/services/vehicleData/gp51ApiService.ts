
import { supabase } from '@/integrations/supabase/client';
import { unifiedGP51SessionManager } from '../unifiedGP51SessionManager';

export interface GP51Vehicle {
  deviceid: string;
  devicename: string;
  groupname?: string;
  status?: string;
}

export interface GP51Position {
  deviceid: string;
  callat: number;
  callon: number;
  speed: number;
  course: number;
  updatetime: string;
  strstatusen: string;
}

export interface PositionUpdate {
  deviceid: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

export class GP51ApiService {
  /**
   * Fetch vehicle list from GP51
   */
  static async fetchVehicleList(): Promise<GP51Vehicle[]> {
    try {
      console.log('🚗 Fetching vehicle list from GP51...');
      
      const { data, error } = await supabase.functions.invoke('gp51-live-import');

      if (error) {
        console.error('❌ Vehicle list fetch error:', error);
        throw new Error(`Vehicle list fetch failed: ${error.message}`);
      }

      if (!data.success) {
        console.error('❌ GP51 live import failed:', data.error);
        throw new Error(`GP51 API error: ${data.error}`);
      }

      const vehicles = data.data?.devices || [];
      console.log(`✅ Fetched ${vehicles.length} vehicles from GP51`);
      return vehicles;

    } catch (error) {
      console.error('❌ Vehicle list fetch exception:', error);
      throw error;
    }
  }

  /**
   * Fetch positions for specific device IDs (consolidated from positionOnlyApiService)
   */
  static async fetchPositions(deviceIds: string[]): Promise<GP51Position[]> {
    if (deviceIds.length === 0) {
      console.log('📍 No device IDs provided for position fetch');
      return [];
    }

    try {
      console.log(`📍 Fetching positions for ${deviceIds.length} devices...`);
      
      const { data, error } = await supabase.functions.invoke('gp51-live-import');

      if (error) {
        console.error('❌ Position fetch error:', error);
        return [];
      }

      if (!data.success) {
        console.warn('⚠️ Position fetch failed:', data.error);
        return [];
      }

      const positions = data.data?.positions || [];
      console.log(`✅ Fetched ${positions.length} positions`);
      return positions;

    } catch (error) {
      console.error('❌ Position fetch exception:', error);
      return [];
    }
  }

  /**
   * Fetch only position data for active vehicles (lightweight)
   * Consolidated from positionOnlyApiService
   */
  static async fetchPositionsOnly(deviceIds: number[]): Promise<PositionUpdate[]> {
    if (deviceIds.length === 0) {
      console.log('📍 No device IDs provided for position fetch');
      return [];
    }

    try {
      console.log(`📍 Fetching positions for ${deviceIds.length} devices...`);
      
      const sessionInfo = await this.getSessionInfo();
      if (!sessionInfo.token) {
        console.error('❌ No valid session token available');
        return [];
      }
      
      // Simplified approach: invoke telemetry-positions function directly
      const response = await supabase.functions.invoke('telemetry-positions', {
        body: { 
          token: sessionInfo.token,
          deviceIds: deviceIds.map(String)
        }
      });

      if (response.error) {
        console.error('❌ Position fetch error:', response.error);
        return [];
      }

      const data = response.data;
      if (!data?.success) {
        console.warn('⚠️ Position fetch failed:', data?.error);
        return [];
      }

      console.log(`✅ Fetched ${data.positions?.length || 0} positions`);
      return data.positions || [];

    } catch (error) {
      console.error('❌ Position fetch exception:', error);
      return [];
    }
  }

  /**
   * Update vehicle positions in database (simplified bulk operation)
   * Consolidated from positionOnlyApiService with simplified database operations
   */
  static async updateVehiclePositionsInDatabase(positions: PositionUpdate[]): Promise<{
    updated: number;
    errors: number;
  }> {
    let updated = 0;
    let errors = 0;

    // Process positions in smaller batches to avoid complex operations
    const batchSize = 10;
    for (let i = 0; i < positions.length; i += batchSize) {
      const batch = positions.slice(i, i + batchSize);
      
      for (const position of batch) {
        try {
          // Simplified approach: use individual operations instead of complex chaining
          const updateData = {
            latitude: position.lat,
            longitude: position.lon,
            speed: position.speed,
            heading: position.course,
            last_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Simple operation to avoid TS2589 error
          const result = await supabase
            .from('vehicles')
            .update(updateData)
            .eq('device_id', position.deviceid);

          if (result.error) {
            console.error(`❌ Failed to update vehicle ${position.deviceid}:`, result.error);
            errors++;
          } else {
            updated++;
          }
        } catch (error) {
          console.error(`❌ Exception updating vehicle ${position.deviceid}:`, error);
          errors++;
        }
      }
    }

    return { updated, errors };
  }

  /**
   * Get session information (consolidated method)
   */
  private static async getSessionInfo(): Promise<{ token?: string }> {
    try {
      const response = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (response.error || !response.data) {
        console.error('❌ Failed to get session info:', response.error);
        return {};
      }

      const data = response.data;
      const sessionToken = data.session?.token;
      const directToken = data.token;
      const token = sessionToken || directToken;
      
      return { token };
    } catch (error) {
      console.error('❌ Failed to get session info:', error);
      return {};
    }
  }
}
