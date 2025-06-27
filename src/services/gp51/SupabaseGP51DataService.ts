
import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51DeviceTreeResponse,
  GP51Position,
  GP51HealthStatus
} from '@/types/gp51-unified';

export interface GP51Device {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  device_type: number;
  group_id: number;
  group_name: string;
  is_free: number;
  last_active_time: number;
  status: string;
  created_at: string;
  updated_at: string;
  raw_data: any;
}

export class SupabaseGP51DataService {
  
  async queryMonitorList(): Promise<GP51DeviceTreeResponse> {
    try {
      console.log('🔍 Fetching GP51 device tree via Supabase...');

      const { data, error } = await supabase.functions.invoke('gp51-devices');

      if (error) {
        console.error('❌ Device tree fetch error:', error);
        return {
          success: false,
          data: [],
          groups: [],
          error: error.message || 'Failed to fetch devices'
        };
      }

      if (!data.success) {
        console.error('❌ GP51 device fetch failed:', data.error);
        return {
          success: false,
          data: [],
          groups: [],
          error: data.error || 'Failed to fetch devices'
        };
      }

      console.log(`✅ Successfully fetched ${data.deviceCount} devices in ${data.groupCount} groups`);

      return {
        success: true,
        data: data.devices || [],
        groups: data.groups || [],
        deviceCount: data.deviceCount,
        groupCount: data.groupCount
      };

    } catch (error) {
      console.error('💥 Device tree error:', error);
      return {
        success: false,
        data: [],
        groups: [],
        error: error instanceof Error ? error.message : 'Device fetch failed'
      };
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      console.log(`📍 Fetching positions for ${deviceIds?.length || 'all'} devices...`);

      const { data, error } = await supabase.functions.invoke('gp51-get-positions', {
        body: { 
          deviceIds: deviceIds || [],
          lastQueryTime: 0
        }
      });

      if (error) {
        console.error('❌ Position fetch error:', error);
        return [];
      }

      if (!data.success) {
        console.error('❌ GP51 position fetch failed:', data.error);
        return [];
      }

      console.log(`✅ Successfully fetched ${data.validRecords} valid positions`);

      return data.positions || [];

    } catch (error) {
      console.error('💥 Get positions error:', error);
      return [];
    }
  }

  // Get cached devices from Supabase database
  async getCachedDevices(): Promise<GP51Device[]> {
    try {
      const { data, error } = await supabase
        .from('gp51_devices')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Cached devices error:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('💥 Get cached devices error:', error);
      return [];
    }
  }

  // Get cached positions from Supabase database
  async getCachedPositions(deviceIds?: string[], limit: number = 1000): Promise<GP51Position[]> {
    try {
      let query = supabase
        .from('gp51_positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (deviceIds && deviceIds.length > 0) {
        query = query.in('device_id', deviceIds);
      }

      const { data, error } = await query.limit(limit);

      if (error) {
        console.error('❌ Cached positions error:', error);
        return [];
      }

      // Transform database format to GP51 format
      return (data || []).map(pos => ({
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
        satellites: pos.satellites
      }));

    } catch (error) {
      console.error('💥 Get cached positions error:', error);
      return [];
    }
  }

  async getHealthStatus(): Promise<GP51HealthStatus> {
    try {
      const startTime = Date.now();
      
      // Test device tree fetch
      const deviceTree = await this.queryMonitorList();
      const responseTime = Date.now() - startTime;

      // Check Supabase auth status
      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session;

      // Check active GP51 session
      let hasActiveGP51Session = false;
      if (session) {
        const { data: gp51Sessions } = await supabase
          .from('gp51_sessions')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
          .limit(1);

        hasActiveGP51Session = !!(gp51Sessions && gp51Sessions.length > 0);
      }

      const isConnected = deviceTree.success && hasActiveGP51Session;

      return {
        status: isConnected ? 'healthy' : 'failed',
        lastCheck: new Date(),
        responseTime,
        isConnected,
        lastPingTime: new Date(),
        tokenValid: hasActiveGP51Session,
        sessionValid: isAuthenticated,
        activeDevices: deviceTree.deviceCount || 0,
        errorMessage: deviceTree.error,
        isHealthy: isConnected,
        connectionStatus: isConnected ? 'connected' : 'disconnected'
      };

    } catch (error) {
      return {
        status: 'failed',
        lastCheck: new Date(),
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errorMessage: error instanceof Error ? error.message : 'Health check failed',
        isHealthy: false,
        connectionStatus: 'error'
      };
    }
  }

  // Set up real-time position updates
  setupRealtimePositions(callback: (positions: GP51Position[]) => void) {
    const channel = supabase
      .channel('gp51_positions_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gp51_positions'
        },
        (payload) => {
          console.log('📡 New position received:', payload.new);
          // Fetch updated positions and call callback
          this.getCachedPositions().then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  // Set up real-time device updates
  setupRealtimeDevices(callback: (devices: GP51Device[]) => void) {
    const channel = supabase
      .channel('gp51_devices_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gp51_devices'
        },
        (payload) => {
          console.log('📡 Device update received:', payload);
          // Fetch updated devices and call callback
          this.getCachedDevices().then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseGP51DataService = new SupabaseGP51DataService();
