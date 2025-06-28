
import { supabase } from '@/integrations/supabase/client';
import type { GP51PositionRPCResponse } from '@/types/gp51-supabase';
import { gp51DataService } from './GP51DataService';
import { supabaseGP51AuthService } from './SupabaseGP51AuthService';

export class SupabaseGP51DataService {
  private static instance: SupabaseGP51DataService;

  private constructor() {}

  static getInstance(): SupabaseGP51DataService {
    if (!SupabaseGP51DataService.instance) {
      SupabaseGP51DataService.instance = new SupabaseGP51DataService();
    }
    return SupabaseGP51DataService.instance;
  }

  async getDevices(): Promise<any[]> {
    try {
      console.log('🔍 Fetching GP51 devices via Supabase integration...');

      // First ensure we have authentication
      if (!supabaseGP51AuthService.isAuthenticated) {
        console.error('❌ No GP51 authentication found');
        return [];
      }

      // Use real GP51 data service instead of edge function
      const result = await gp51DataService.queryMonitorList();

      if (!result.success) {
        console.error('❌ GP51 devices fetch failed:', result.error);
        return [];
      }

      console.log('✅ GP51 devices fetched successfully via direct API');
      return result.data || [];

    } catch (error) {
      console.error('💥 Get devices error:', error);
      return [];
    }
  }

  async getPositions(deviceIds?: string[]): Promise<any[]> {
    try {
      console.log('🔍 Fetching GP51 positions via Supabase integration...');

      // First ensure we have authentication
      if (!supabaseGP51AuthService.isAuthenticated) {
        console.error('❌ No GP51 authentication found');
        return [];
      }

      // Try live positions first from direct API
      const livePositions = await gp51DataService.getPositions(deviceIds);
      
      if (livePositions.length > 0) {
        console.log('✅ Live GP51 positions fetched successfully');
        
        // Transform GP51 format to internal format
        return livePositions.map(pos => ({
          deviceid: pos.deviceid,
          callat: pos.callat,
          callon: pos.callon,
          speed: pos.speed,
          course: pos.course,
          altitude: pos.altitude,
          devicetime: pos.devicetime,
          servertime: pos.servertime || new Date().toISOString(),
          status: pos.status,
          moving: pos.moving,
          gotsrc: pos.gotsrc,
          battery: pos.battery || 0,
          signal: pos.signal || 0,
          satellites: pos.satellites || 0
        }));
      }

      // Fallback to cached positions using RPC function
      console.log('⚠️ Live positions empty, trying cached positions...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ No Supabase session found');
        return [];
      }

      const { data: cachedData, error: cachedError } = await supabase
        .rpc('get_cached_positions', {
          p_user_id: session.user.id,
          p_device_ids: deviceIds || null
        });

      if (cachedError) {
        console.error('❌ Cached positions RPC error:', cachedError);
        return [];
      }

      // Handle the response properly - it should be an array
      const positionsArray = Array.isArray(cachedData) ? cachedData : [];
      
      return positionsArray.map((pos: GP51PositionRPCResponse) => ({
        deviceid: pos.device_id,
        callat: pos.latitude,
        callon: pos.longitude,
        speed: pos.speed,
        course: pos.course,
        altitude: pos.altitude,
        devicetime: pos.device_time,
        servertime: pos.server_time || new Date().toISOString(),
        status: pos.status,
        moving: pos.moving,
        gotsrc: pos.gps_source,
        battery: pos.battery || 0,
        signal: pos.signal || 0,
        satellites: pos.satellites || 0,
        raw_data: pos.raw_data
      }));

    } catch (error) {
      console.error('💥 Get positions error:', error);
      return [];
    }
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, any>> {
    const positions = await this.getPositions(deviceIds);
    const devicePositions = new Map<string, any>();
    
    positions.forEach(pos => {
      if (deviceIds.includes(pos.deviceid)) {
        devicePositions.set(pos.deviceid, pos);
      }
    });
    
    return devicePositions;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Use the real data service for connection testing
      return await gp51DataService.testConnection();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

export const supabaseGP51DataService = SupabaseGP51DataService.getInstance();
