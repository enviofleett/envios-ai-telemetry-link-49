
import { supabaseGP51AuthService } from './SupabaseGP51AuthService';
import { GP51_BASE_URL, GP51_ACTIONS } from './urlHelpers';
import type { GP51Device, GP51Position, GP51Group, GP51HealthStatus, GP51PerformanceMetrics } from '@/types/gp51-unified';

// Cache management
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class GP51Cache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 300000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

// Rate limiting
class RateLimiter {
  private attempts = new Map<string, number>();
  private lastAttempt = new Map<string, number>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 3600000; // 1 hour

  canAttempt(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || 0;
    const lastTime = this.lastAttempt.get(key) || 0;

    if (now - lastTime > this.windowMs) {
      this.attempts.delete(key);
      this.lastAttempt.delete(key);
      return true;
    }

    return attempts < this.maxAttempts;
  }

  recordAttempt(key: string): void {
    const attempts = this.attempts.get(key) || 0;
    this.attempts.set(key, attempts + 1);
    this.lastAttempt.set(key, Date.now());
  }
}

export class GP51DataService {
  private cache = new GP51Cache();
  private rateLimiter = new RateLimiter();
  private readonly defaultTimeout = 10000;
  private readonly maxRetries = 3;

  // Convert GP51 API response to unified format
  private mapDeviceToUnified(device: any): GP51Device {
    return {
      deviceid: device.deviceid || device.device_id || '',
      devicename: device.devicename || device.device_name || '',
      devicetype: String(device.devicetype || device.device_type || '0'),
      groupid: device.groupid || device.group_id || '',
      groupname: device.groupname || device.group_name || '',
      imei: device.imei || '',
      simcardno: device.simcardno || device.sim_card_no || '',
      status: device.status || 0,
      createtime: device.createtime || device.create_time || new Date().toISOString(),
      lastactivetime: device.lastactivetime || device.last_active_time || new Date().toISOString(),
      isOnline: device.isOnline || device.is_online || false,
      vehicleInfo: device.vehicleInfo || device.vehicle_info || null
    };
  }

  private mapPositionToUnified(position: any): GP51Position {
    return {
      deviceid: position.deviceid || position.device_id || '',
      callat: position.callat || position.latitude || 0,
      callon: position.callon || position.longitude || 0,
      speed: position.speed || 0,
      course: position.course || position.direction || 0,
      altitude: position.altitude || 0,
      devicetime: position.devicetime || position.device_time || new Date().toISOString(),
      servertime: position.servertime || position.server_time || new Date().toISOString(),
      status: position.status || 0,
      moving: position.moving || false,
      gotsrc: position.gotsrc || position.gps_source || 0,
      battery: position.battery || 0,
      signal: position.signal || 0,
      satellites: position.satellites || 0,
      totaldistance: position.totaldistance || position.total_distance || 0,
      strstatus: position.strstatus || position.str_status || '',
      strstatusen: position.strstatusen || position.str_status_en || '',
      alarm: position.alarm || 0,
      alarmtype: position.alarmtype || position.alarm_type || '',
      alarmtypeen: position.alarmtypeen || position.alarm_type_en || '',
      address: position.address || '',
      addressen: position.addressen || position.address_en || '',
      geoaddr: position.geoaddr || position.geo_addr || '',
      geoaddrfrom: position.geoaddrfrom || position.geo_addr_from || '',
      accuracyvalue: position.accuracyvalue || position.accuracy_value || 0,
      location: position.location || null,
      temperature: position.temperature || null,
      humidity: position.humidity || null,
      pressure: position.pressure || null,
      fuel: position.fuel || null,
      engine: position.engine || null,
      door: position.door || null,
      air_condition: position.air_condition || null,
      custom_data: position.custom_data || null,
      raw_data: position.raw_data || null
    };
  }

  private mapGroupToUnified(group: any): GP51Group {
    return {
      groupid: group.groupid || group.group_id || '',
      groupname: group.groupname || group.group_name || '',
      parentgroupid: group.parentgroupid || group.parent_group_id || '',
      level: group.level || 0,
      devicecount: group.devicecount || group.device_count || 0,
      children: group.children || []
    };
  }

  private async makeGP51Request(action: string, additionalParams: Record<string, any> = {}): Promise<any> {
    const sessionInfo = supabaseGP51AuthService.sessionInfo;
    if (!sessionInfo?.gp51_token) {
      throw new Error('No valid GP51 session found. Please authenticate first.');
    }

    const rateLimitKey = `gp51_${action}`;
    if (!this.rateLimiter.canAttempt(rateLimitKey)) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }

    const url = new URL(GP51_BASE_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('token', sessionInfo.gp51_token);

    // Add additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    console.log(`🌐 [GP51DataService] Making request: ${action}`);
    const startTime = Date.now();

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'GP51-Client/1.0',
          'Accept': 'application/json'
        },
        signal: AbortSignal.timeout(this.defaultTimeout)
      });

      const responseTime = Date.now() - startTime;
      this.rateLimiter.recordAttempt(rateLimitKey);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ [GP51DataService] Request completed in ${responseTime}ms`);

      if (data.status !== 0) {
        throw new Error(data.cause || `GP51 API error: status ${data.status}`);
      }

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [GP51DataService] Request failed after ${responseTime}ms:`, error);
      throw error;
    }
  }

  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51Device[];
    groups?: GP51Group[];
    error?: string;
  }> {
    const cacheKey = 'monitor_list';
    
    try {
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('📦 [GP51DataService] Returning cached monitor list');
        return cached;
      }

      console.log('🔍 [GP51DataService] Fetching fresh monitor list from GP51...');
      
      const response = await this.makeGP51Request(GP51_ACTIONS.DEVICE_TREE);
      
      const devices: GP51Device[] = [];
      const groups: GP51Group[] = [];

      // Process the response data
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((item: any) => {
          if (item.deviceid) {
            devices.push(this.mapDeviceToUnified(item));
          } else if (item.groupid) {
            groups.push(this.mapGroupToUnified(item));
          }
        });
      }

      const result = {
        success: true,
        data: devices,
        groups: groups
      };

      // Cache the result
      this.cache.set(cacheKey, result, 300000); // 5 minutes

      console.log(`✅ [GP51DataService] Monitor list fetched: ${devices.length} devices, ${groups.length} groups`);
      return result;

    } catch (error) {
      console.error('❌ [GP51DataService] Monitor list fetch failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch monitor list'
      };
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    const cacheKey = `positions_${deviceIds?.join(',') || 'all'}`;
    
    try {
      // Check cache first
      const cached = this.cache.get<GP51Position[]>(cacheKey);
      if (cached) {
        console.log('📦 [GP51DataService] Returning cached positions');
        return cached;
      }

      console.log('🔍 [GP51DataService] Fetching fresh positions from GP51...');
      
      const params: Record<string, any> = {};
      if (deviceIds && deviceIds.length > 0) {
        params.deviceids = deviceIds.join(',');
      }

      const response = await this.makeGP51Request(GP51_ACTIONS.POSITIONS, params);
      
      const positions: GP51Position[] = [];

      if (response.data && Array.isArray(response.data)) {
        response.data.forEach((item: any) => {
          positions.push(this.mapPositionToUnified(item));
        });
      }

      // Cache the result
      this.cache.set(cacheKey, positions, 60000); // 1 minute for positions

      console.log(`✅ [GP51DataService] Positions fetched: ${positions.length} records`);
      return positions;

    } catch (error) {
      console.error('❌ [GP51DataService] Position fetch failed:', error);
      return [];
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    return this.getLastPositions(deviceIds);
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔍 [GP51DataService] Testing GP51 connection...');
      
      // Try to fetch a small amount of data to test connectivity
      await this.makeGP51Request(GP51_ACTIONS.DEVICE_TREE);
      
      console.log('✅ [GP51DataService] Connection test successful');
      return { success: true };

    } catch (error) {
      console.error('❌ [GP51DataService] Connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  getPerformanceMetrics(): GP51PerformanceMetrics {
    return {
      success: true,
      requestStartTime: Date.now(),
      timestamp: new Date(),
      deviceCount: 0,
      positionCount: 0,
      responseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      apiCallsCount: 0,
      lastSuccessfulCall: new Date(),
      lastFailedCall: null,
      averageResponseTime: 0,
      peakResponseTime: 0,
      systemLoad: 0,
      memoryUsage: 0,
      networkLatency: 0,
      connectionHealth: 100
    };
  }

  clearCache(): void {
    console.log('🧹 [GP51DataService] Clearing cache');
    this.cache.clear();
  }

  // Health check method
  async healthCheck(): Promise<GP51HealthStatus> {
    const startTime = Date.now();
    
    try {
      const connectionTest = await this.testConnection();
      const responseTime = Date.now() - startTime;
      const authStatus = supabaseGP51AuthService.getSessionStatus();

      return {
        status: connectionTest.success ? 'healthy' : 'unhealthy',
        isHealthy: connectionTest.success,
        connectionStatus: connectionTest.success ? 'connected' : 'disconnected',
        isConnected: connectionTest.success,
        lastPingTime: new Date(),
        responseTime,
        tokenValid: authStatus.isAuthenticated,
        sessionValid: !authStatus.isExpired,
        activeDevices: 0,
        errorMessage: connectionTest.error,
        lastCheck: new Date()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        isHealthy: false,
        connectionStatus: 'error',
        isConnected: false,
        lastPingTime: new Date(),
        responseTime: Date.now() - startTime,
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errorMessage: error instanceof Error ? error.message : 'Health check failed',
        lastCheck: new Date()
      };
    }
  }
}

export const gp51DataService = new GP51DataService();
