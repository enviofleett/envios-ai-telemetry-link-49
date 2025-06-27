
import { supabase } from '@/integrations/supabase/client';
import type { GP51PositionRPCResponse } from '@/types/gp51-supabase';

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
      console.log('🔍 Fetching GP51 devices from Supabase...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ No Supabase session found');
        return [];
      }

      // Call GP51 devices edge function
      const { data, error } = await supabase.functions.invoke('gp51-devices');

      if (error) {
        console.error('❌ GP51 devices error:', error);
        return [];
      }

      if (!data.success) {
        console.error('❌ GP51 devices failed:', data.error);
        return [];
      }

      console.log('✅ GP51 devices fetched successfully');
      return data.devices || [];

    } catch (error) {
      console.error('💥 Get devices error:', error);
      return [];
    }
  }

  async getPositions(deviceIds?: string[]): Promise<any[]> {
    try {
      console.log('🔍 Fetching GP51 positions...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ No Supabase session found');
        return [];
      }

      // First try to get live positions from edge function
      const { data: liveData, error: liveError } = await supabase.functions.invoke('gp51-get-positions', {
        body: { deviceIds: deviceIds || [] }
      });

      if (!liveError && liveData?.success) {
        console.log('✅ Live GP51 positions fetched successfully');
        return liveData.positions || [];
      }

      // Fallback to cached positions using RPC function
      console.log('⚠️ Live positions failed, trying cached positions...');
      
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
        servertime: pos.server_time,
        status: pos.status,
        moving: pos.moving,
        gotsrc: pos.gps_source,
        battery: pos.battery,
        signal: pos.signal,
        satellites: pos.satellites,
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
      const devices = await this.getDevices();
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

export const supabaseGP51DataService = SupabaseGP51DataService.getInstance();
