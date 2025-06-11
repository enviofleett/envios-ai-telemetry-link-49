
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
   * Fetch positions for specific device IDs
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
}
