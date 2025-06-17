
import { supabase } from '@/integrations/supabase/client';

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

// Explicit interface for database updates to prevent deep type inference
interface VehicleUpdateData {
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  last_update: string;
  updated_at: string;
}

// Type for bulk upsert operations
interface VehicleUpsertData extends VehicleUpdateData {
  device_id: string;
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
   * Update vehicle positions using bulk upsert (CRITICAL FIX for TS2589)
   */
  static async updateVehiclePositionsInDatabase(positions: PositionUpdate[]): Promise<{
    updated: number;
    errors: number;
  }> {
    if (positions.length === 0) {
      return { updated: 0, errors: 0 };
    }

    try {
      console.log(`🔄 Updating ${positions.length} vehicle positions using bulk upsert...`);
      
      // Transform positions to upsert data with explicit typing
      const upsertData: VehicleUpsertData[] = positions.map((position): VehicleUpsertData => ({
        device_id: position.deviceid,
        latitude: position.lat,
        longitude: position.lon,
        speed: position.speed,
        heading: position.course,
        last_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Use aggressive type casting to prevent deep type inference
      const supabaseClient = supabase as any;
      
      // Bulk upsert operation with explicit type boundaries
      const result = await supabaseClient
        .from('vehicles')
        .upsert(upsertData, { 
          onConflict: 'device_id',
          ignoreDuplicates: false 
        });

      if (result.error) {
        console.error('❌ Bulk upsert failed:', result.error);
        return { updated: 0, errors: positions.length };
      }

      console.log(`✅ Successfully updated ${positions.length} vehicle positions`);
      return { updated: positions.length, errors: 0 };

    } catch (error) {
      console.error('❌ Bulk update exception:', error);
      return { updated: 0, errors: positions.length };
    }
  }

  /**
   * Get session information
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
