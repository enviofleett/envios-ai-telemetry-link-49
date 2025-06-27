
import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51DeviceTreeResponse,
  GP51Position,
  GP51HealthStatus,
  GP51PerformanceMetrics,
  GP51Device as GP51DeviceData
} from '@/types/gp51-unified';

export class SupabaseGP51DataService {
  async queryMonitorList(): Promise<GP51DeviceTreeResponse> {
    try {
      console.log('🔍 Querying GP51 device monitor list...');

      const { data, error } = await supabase.functions.invoke('gp51-devices');

      if (error) {
        console.error('❌ Device list error:', error);
        return {
          success: false,
          data: [],
          groups: [],
          error: error.message || 'Failed to fetch devices'
        };
      }

      if (!data?.success) {
        console.error('❌ GP51 devices API error:', data?.error);
        return {
          success: false,
          data: [],
          groups: [],
          error: data?.error || 'GP51 API error'
        };
      }

      console.log('✅ Device monitor list retrieved successfully');
      
      return {
        success: true,
        data: data.devices || [],
        groups: data.groups || []
      };

    } catch (error) {
      console.error('💥 Device list error:', error);
      return {
        success: false,
        data: [],
        groups: [],
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      console.log('📍 Fetching GP51 positions for devices:', deviceIds?.length || 'all');

      const { data, error } = await supabase.functions.invoke('gp51-get-positions', {
        body: { deviceIds: deviceIds || [] }
      });

      if (error) {
        console.error('❌ Positions error:', error);
        return [];
      }

      if (!data?.success) {
        console.error('❌ GP51 positions API error:', data?.error);
        return [];
      }

      console.log('✅ Positions retrieved:', data.positions?.length || 0);

      // Return positions in the expected format
      return (data.positions || []).map((pos: any) => ({
        deviceid: pos.deviceid,
        callat: pos.callat,
        callon: pos.callon,
        speed: pos.speed,
        course: pos.course,
        altitude: pos.altitude,
        devicetime: pos.devicetime,
        servertime: pos.servertime,
        status: pos.status,
        moving: pos.moving,
        gotsrc: pos.gotsrc,
        battery: pos.battery,
        signal: pos.signal,
        satellites: pos.satellites
      }));

    } catch (error) {
      console.error('💥 Get positions error:', error);
      return [];
    }
  }

  async getCachedPositions(deviceIds?: string[]): Promise<any[]> {
    try {
      let query = supabase
        .from('gp51_positions')
        .select('*')
        .order('created_at', { ascending: false });

      if (deviceIds && deviceIds.length > 0) {
        query = query.in('device_id', deviceIds);
      }

      const { data, error } = await query.limit(1000);

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

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51Position>> {
    const positions = await this.getPositions(deviceIds);
    const devicePositions = new Map<string, GP51Position>();
    
    positions.forEach(pos => {
      if (deviceIds.includes(pos.deviceid)) {
        devicePositions.set(pos.deviceid, pos);
      }
    });
    
    return devicePositions;
  }

  async getLiveVehicles(): Promise<{
    success: boolean;
    data?: any[];
    groups?: any;
    error?: string;
  }> {
    try {
      console.log('🚗 Fetching live vehicles data...');

      const [deviceTree, positions] = await Promise.all([
        this.queryMonitorList(),
        this.getPositions()
      ]);

      if (!deviceTree.success) {
        return {
          success: false,
          error: deviceTree.error
        };
      }

      // Combine device info with real-time positions
      const liveVehicles = deviceTree.data?.map(device => {
        const position = positions.find(pos => pos.deviceid === device.deviceid);
        return {
          ...device,
          position,
          isOnline: position ? position.status === 1 : false,
          isMoving: position ? position.moving === 1 : false,
          latitude: position?.callat,
          longitude: position?.callon,
          speed: position?.speed || 0,
          course: position?.course || 0,
          lastUpdate: position ? new Date(position.devicetime) : null
        };
      }) || [];

      console.log('✅ Live vehicles data prepared:', liveVehicles.length);

      return {
        success: true,
        data: liveVehicles,
        groups: deviceTree.groups
      };
    } catch (error) {
      console.error('💥 Live vehicles error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live data'
      };
    }
  }

  async getHealthStatus(): Promise<GP51HealthStatus> {
    try {
      const startTime = Date.now();
      const deviceTree = await this.queryMonitorList();
      const responseTime = Date.now() - startTime;

      const { data: { session } } = await supabase.auth.getSession();
      const isAuthenticated = !!session;

      return {
        status: deviceTree.success ? 'healthy' : 'failed',
        lastCheck: new Date(),
        responseTime,
        isConnected: deviceTree.success,
        lastPingTime: new Date(),
        tokenValid: isAuthenticated,
        sessionValid: isAuthenticated,
        activeDevices: deviceTree.data?.length || 0,
        isHealthy: deviceTree.success && isAuthenticated,
        connectionStatus: deviceTree.success ? 'connected' : 'disconnected',
        errorMessage: deviceTree.error
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

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    const startTime = Date.now();
    
    try {
      const [health, deviceTree, positions] = await Promise.all([
        this.getHealthStatus(),
        this.queryMonitorList(),
        this.getPositions()
      ]);

      const responseTime = Date.now() - startTime;
      const now = new Date();
      const activeDevices = positions.filter(pos => pos.status === 1).length;
      const movingVehicles = positions.filter(pos => pos.moving === 1).length;

      return {
        responseTime,
        success: health.isHealthy,
        requestStartTime: new Date(startTime).toISOString(),
        timestamp: now.toISOString(),
        deviceCount: deviceTree.data?.length || 0,
        groupCount: deviceTree.groups?.length || 0,
        apiCallCount: 3,
        errorRate: health.isHealthy ? 0 : 1,
        averageResponseTime: responseTime,
        totalVehicles: deviceTree.data?.length || 0,
        activeVehicles: activeDevices,
        activeDevices,
        movingVehicles,
        stoppedVehicles: activeDevices - movingVehicles,
        lastUpdateTime: now,
        dataQuality: health.isHealthy ? 0.95 : 0,
        onlinePercentage: deviceTree.data?.length ? 
          (activeDevices / deviceTree.data.length) * 100 : 0,
        utilizationRate: deviceTree.data?.length ? 
          (movingVehicles / deviceTree.data.length) * 100 : 0
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const now = new Date();
      
      return {
        responseTime,
        success: false,
        requestStartTime: new Date(startTime).toISOString(),
        timestamp: now.toISOString(),
        deviceCount: 0,
        groupCount: 0,
        apiCallCount: 0,
        errorRate: 1,
        averageResponseTime: responseTime,
        totalVehicles: 0,
        activeVehicles: 0,
        activeDevices: 0,
        movingVehicles: 0,
        stoppedVehicles: 0,
        lastUpdateTime: now,
        dataQuality: 0,
        onlinePercentage: 0,
        utilizationRate: 0
      };
    }
  }

  async testConnection(): Promise<GP51HealthStatus> {
    return this.getHealthStatus();
  }

  processPositions(positions: GP51Position[]): GP51Position[] {
    return positions.filter(pos => {
      // Validate GPS coordinates
      const validLat = Math.abs(pos.callat) <= 90;
      const validLon = Math.abs(pos.callon) <= 180;
      return validLat && validLon && pos.deviceid;
    });
  }

  // Real-time subscriptions for live updates
  subscribeToPositionUpdates(callback: (positions: GP51Position[]) => void) {
    const channel = supabase
      .channel('gp51_positions_realtime')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'gp51_positions' },
        (payload) => {
          console.log('📍 New position received:', payload.new);
          // Trigger callback with updated positions
          this.getCachedPositions().then(callback);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseGP51DataService = new SupabaseGP51DataService();
