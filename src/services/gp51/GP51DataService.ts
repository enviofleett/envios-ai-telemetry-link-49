
import type { 
  GP51HealthStatus,
  GP51DeviceTreeResponse as GP51ServiceResponse,
  GP51Position,
  GP51PerformanceMetrics,
  GP51Device as GP51DeviceData
} from '@/types/gp51-unified';
import { gp51AuthService } from './GP51AuthService';
import { supabase } from '@/integrations/supabase/client';

export class GP51DataService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds

  private isDataFresh(key: string): boolean {
    const cached = this.cache.get(key);
    return cached ? Date.now() - cached.timestamp < this.CACHE_TTL : false;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return this.isDataFresh(key) ? cached?.data : null;
  }

  // REAL IMPLEMENTATION: Query actual GP51 device list
  async queryMonitorList(): Promise<GP51ServiceResponse> {
    const cacheKey = 'monitor_list';
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('📋 Using cached device list');
      return cached;
    }

    try {
      if (!gp51AuthService.isSessionValid()) {
        throw new Error('GP51 session expired - please authenticate');
      }

      const session = gp51AuthService.getSession();
      console.log('🔍 Fetching device list from GP51 for user:', session?.username);

      // Call GP51 query devices function
      const { data, error } = await supabase.functions.invoke('gp51-query-devices', {
        body: {
          username: session.username,
          password: 'session_token', // We'll pass the session token
          token: session.token
        }
      });

      if (error) {
        throw new Error(`Device query failed: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch device list');
      }

      const serviceResponse: GP51ServiceResponse = {
        success: true,
        data: data.data || [],
        groups: data.groups || []
      };

      console.log(`✅ Retrieved ${data.data?.length || 0} devices in ${data.groups?.length || 0} groups`);
      
      this.setCache(cacheKey, serviceResponse);
      return serviceResponse;

    } catch (error) {
      console.error('❌ queryMonitorList error:', error);
      return {
        success: false,
        data: [],
        groups: [],
        error: error instanceof Error ? error.message : 'Failed to fetch device list'
      };
    }
  }

  // REAL IMPLEMENTATION: Get actual device positions
  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    const cacheKey = `positions_${deviceIds?.join(',') || 'all'}`;
    const cached = this.getCache(cacheKey);
    if (cached) {
      console.log('📍 Using cached positions');
      return cached;
    }

    try {
      if (!gp51AuthService.isSessionValid()) {
        throw new Error('GP51 session expired - please authenticate');
      }

      const session = gp51AuthService.getSession();
      console.log(`📍 Fetching positions for ${deviceIds?.length || 'all'} devices`);

      // If no device IDs provided, get all devices first
      let targetDeviceIds = deviceIds;
      if (!targetDeviceIds || targetDeviceIds.length === 0) {
        const deviceList = await this.queryMonitorList();
        if (deviceList.success && deviceList.data) {
          targetDeviceIds = deviceList.data.map(device => device.deviceid);
        }
      }

      if (!targetDeviceIds || targetDeviceIds.length === 0) {
        console.log('⚠️ No devices found to fetch positions for');
        return [];
      }

      // Call GP51 positions function
      const { data, error } = await supabase.functions.invoke('gp51-get-positions', {
        body: {
          username: session.username,
          token: session.token,
          deviceIds: targetDeviceIds,
          lastQueryTime: 0
        }
      });

      if (error) {
        throw new Error(`Position query failed: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch positions');
      }

      const positions = this.validateAndProcessPositions(data.positions || []);
      console.log(`✅ Retrieved ${positions.length} valid positions`);
      
      this.setCache(cacheKey, positions);
      return positions;

    } catch (error) {
      console.error('❌ getPositions error:', error);
      return [];
    }
  }

  // Validate and process position data
  private validateAndProcessPositions(positions: any[]): GP51Position[] {
    return positions
      .filter(pos => {
        // Validate required fields
        if (!pos.deviceid) return false;
        
        // Validate GPS coordinates
        const lat = parseFloat(pos.callat || pos.latitude || 0);
        const lon = parseFloat(pos.callon || pos.longitude || 0);
        
        const validLat = Math.abs(lat) <= 90;
        const validLon = Math.abs(lon) <= 180;
        
        return validLat && validLon;
      })
      .map(pos => ({
        ...pos,
        // Standardize coordinate fields
        deviceid: pos.deviceid,
        callat: parseFloat(pos.callat || pos.latitude || 0),
        callon: parseFloat(pos.callon || pos.longitude || 0),
        latitude: parseFloat(pos.callat || pos.latitude || 0),
        longitude: parseFloat(pos.callon || pos.longitude || 0),
        speed: Math.max(0, parseFloat(pos.speed || 0)),
        course: ((parseFloat(pos.course || 0) + 360) % 360),
        status: parseInt(pos.status || 0),
        moving: parseInt(pos.moving || 0),
        devicetime: pos.devicetime ? new Date(pos.devicetime).getTime() : Date.now()
      }));
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

  // REAL IMPLEMENTATION: Get live vehicle data combining devices and positions
  async getLiveVehicles(): Promise<{
    success: boolean;
    data?: any[];
    groups?: any;
    error?: string;
  }> {
    try {
      console.log('🚗 Fetching live vehicle data...');
      
      // Fetch devices and positions in parallel
      const [deviceTreeResult, positions] = await Promise.all([
        this.queryMonitorList(),
        this.getPositions()
      ]);

      if (!deviceTreeResult.success) {
        throw new Error(deviceTreeResult.error || 'Failed to fetch device tree');
      }

      // Combine device data with real-time positions
      const liveVehicles = (deviceTreeResult.data || []).map(device => {
        const position = positions.find(pos => pos.deviceid === device.deviceid);
        
        return {
          ...device,
          // Position data
          position,
          latitude: position?.latitude || null,
          longitude: position?.longitude || null,
          speed: position?.speed || 0,
          course: position?.course || 0,
          
          // Status calculations
          isOnline: position ? position.status === 1 : false,
          isMoving: position ? position.moving === 1 : false,
          isActive: device.status === 'active' || device.isfree === 1,
          
          // Timing
          lastUpdate: position ? new Date(position.devicetime) : null,
          lastActiveTime: device.lastactivetime ? new Date(device.lastactivetime) : null,
          
          // Additional computed fields
          statusText: this.getStatusText(device, position),
          batteryLevel: position?.battery || null,
          signal: position?.signal || null
        };
      });

      const onlineCount = liveVehicles.filter(v => v.isOnline).length;
      const movingCount = liveVehicles.filter(v => v.isMoving).length;
      
      console.log(`✅ Live vehicles: ${liveVehicles.length} total, ${onlineCount} online, ${movingCount} moving`);

      return {
        success: true,
        data: liveVehicles,
        groups: deviceTreeResult.groups
      };

    } catch (error) {
      console.error('❌ getLiveVehicles error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live vehicles'
      };
    }
  }

  private getStatusText(device: any, position: GP51Position | undefined): string {
    if (!position) return 'Offline';
    
    if (position.status === 1) {
      return position.moving === 1 ? 'Moving' : 'Parked';
    }
    
    return 'Inactive';
  }

  // REAL IMPLEMENTATION: Health status using actual API calls
  async getHealthStatus(): Promise<GP51HealthStatus> {
    try {
      const startTime = Date.now();
      
      // Test connection by making actual API call
      const deviceTreeResult = await this.queryMonitorList();
      const responseTime = Date.now() - startTime;
      
      const isAuthenticated = gp51AuthService.isAuthenticated;
      const isConnected = deviceTreeResult.success && isAuthenticated;

      return {
        status: isConnected ? 'healthy' : 'failed',
        lastCheck: new Date(),
        responseTime,
        isConnected,
        lastPingTime: new Date(),
        tokenValid: isAuthenticated,
        sessionValid: gp51AuthService.isSessionValid(),
        activeDevices: deviceTreeResult.data?.length || 0,
        isHealthy: isConnected,
        connectionStatus: isConnected ? 'connected' : 'disconnected',
        errorMessage: deviceTreeResult.error
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
      // Make real API calls to gather metrics
      const [healthStatus, deviceTreeResult, positions] = await Promise.all([
        this.getHealthStatus(),
        this.queryMonitorList(),
        this.getPositions()
      ]);

      const responseTime = Date.now() - startTime;
      const now = new Date();
      
      // Calculate real metrics from actual data
      const activeDevices = positions.filter(pos => pos.status === 1).length;
      const movingVehicles = positions.filter(pos => pos.moving === 1).length;
      const totalDevices = deviceTreeResult.data?.length || 0;

      return {
        // Core metrics
        responseTime,
        success: healthStatus.isHealthy,
        requestStartTime: new Date(startTime).toISOString(),
        timestamp: now.toISOString(),
        
        // Count metrics
        deviceCount: totalDevices,
        groupCount: deviceTreeResult.groups?.length || 0,
        apiCallCount: 3, // We made 3 API calls
        
        // Performance metrics
        errorRate: healthStatus.isHealthy ? 0 : 1,
        averageResponseTime: responseTime / 3,
        
        // Vehicle metrics
        totalVehicles: totalDevices,
        activeVehicles: activeDevices,
        activeDevices,
        movingVehicles,
        stoppedVehicles: activeDevices - movingVehicles,
        
        // Additional metrics
        lastUpdateTime: now,
        dataQuality: healthStatus.isHealthy ? (activeDevices / Math.max(totalDevices, 1)) : 0,
        onlinePercentage: totalDevices > 0 ? (activeDevices / totalDevices) * 100 : 0,
        utilizationRate: totalDevices > 0 ? (movingVehicles / totalDevices) * 100 : 0
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
    console.log('🔍 Testing GP51 connection...');
    return this.getHealthStatus();
  }

  processPositions(positions: GP51Position[]): GP51Position[] {
    return this.validateAndProcessPositions(positions);
  }
}

export const gp51DataService = new GP51DataService();
