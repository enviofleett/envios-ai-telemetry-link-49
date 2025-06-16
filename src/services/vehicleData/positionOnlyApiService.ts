
import { supabase } from '@/integrations/supabase/client';

export interface PositionUpdate {
  deviceid: string;
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

export class PositionOnlyApiService {
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
      
      const { data, error } = await supabase.functions.invoke('telemetry-positions', {
        body: { 
          token: sessionInfo.token,
          deviceIds: deviceIds.map(String)
        }
      });

      if (error) {
        console.error('❌ Position fetch error:', error);
        return [];
      }

      if (!data.success) {
        console.warn('⚠️ Position fetch failed:', data.error);
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
   * Update vehicle positions in database (bulk operation)
   */
  static async updateVehiclePositionsInDatabase(positions: PositionUpdate[]): Promise<{
    updated: number;
    errors: number;
  }> {
    let updated = 0;
    let errors = 0;

    for (const position of positions) {
      try {
        const { error } = await supabase
          .from('vehicles')
          .update({
            latitude: position.lat,
            longitude: position.lon,
            speed: position.speed,
            heading: position.course,
            last_update: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('device_id', position.deviceid);

        if (error) {
          console.error(`❌ Failed to update vehicle ${position.deviceid}:`, error);
          errors++;
        } else {
          updated++;
        }
      } catch (error) {
        console.error(`❌ Exception updating vehicle ${position.deviceid}:`, error);
        errors++;
      }
    }

    return { updated, errors };
  }

  private static async getSessionInfo(): Promise<{ token?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (error || !data) {
        console.error('❌ Failed to get session info:', error);
        return {};
      }

      // Extract token from session data
      const token = data.session?.token || data.token;
      return { token };
    } catch (error) {
      console.error('❌ Failed to get session info:', error);
      return {};
    }
  }
}
