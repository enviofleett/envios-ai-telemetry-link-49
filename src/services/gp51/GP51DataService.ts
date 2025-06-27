
import { GP51_BASE_URL, GP51_ACTIONS, buildGP51ApiUrl } from './urlHelpers';
import { supabaseGP51AuthService } from './SupabaseGP51AuthService';

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: string;
  lastactivetime: number;
  groupid?: number;
  groupname?: string;
}

export interface GP51Position {
  deviceid: string;
  callat: number; // GP51 uses callat for latitude
  callon: number; // GP51 uses callon for longitude
  speed: number;
  course: number;
  altitude: number;
  devicetime: string;
  servertime: string;
  status: number;
  moving: number;
  gotsrc?: string;
  battery?: number;
  signal?: number;
  satellites?: number;
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  devices: GP51Device[];
}

export class GP51DataService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private getCache(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  private async makeAuthenticatedRequest(action: string, body?: any): Promise<any> {
    // Get token from authentication service
    const sessionInfo = supabaseGP51AuthService.sessionInfo;
    if (!sessionInfo?.gp51_token) {
      throw new Error('No valid GP51 session found. Please authenticate first.');
    }

    const url = buildGP51ApiUrl(action, sessionInfo.gp51_token);
    console.log(`🌐 Making GP51 API call: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Envios-Fleet/1.0'
        },
        body: body ? JSON.stringify(body) : JSON.stringify({
          username: sessionInfo.gp51_username
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📊 GP51 API response for ${action}:`, result);

      if (result.status !== 0) {
        throw new Error(`GP51 API error: ${result.cause || 'Unknown error'}`);
      }

      return result;
    } catch (error) {
      console.error(`❌ GP51 API call failed for ${action}:`, error);
      throw error;
    }
  }

  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51Device[];
    groups?: GP51Group[];
    error?: string;
  }> {
    try {
      console.log('🔍 Fetching GP51 device tree...');

      // Check cache first
      const cacheKey = 'device-tree';
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('✅ Using cached device tree data');
        return cached;
      }

      // Make real API call using correct action
      const result = await this.makeAuthenticatedRequest(GP51_ACTIONS.DEVICE_TREE);

      if (result.groups && Array.isArray(result.groups)) {
        const devices: GP51Device[] = [];
        const groups: GP51Group[] = result.groups.map((group: any) => ({
          groupid: group.groupid,
          groupname: group.groupname,
          devices: group.devices || []
        }));

        // Flatten devices from all groups
        groups.forEach(group => {
          if (group.devices) {
            devices.push(...group.devices);
          }
        });

        const response = {
          success: true,
          data: devices,
          groups: groups
        };

        // Cache the result
        this.setCache(cacheKey, response);

        console.log(`✅ Fetched ${devices.length} devices in ${groups.length} groups`);
        return response;
      }

      console.warn('⚠️ No groups found in GP51 response');
      return {
        success: true,
        data: [],
        groups: []
      };

    } catch (error) {
      console.error('💥 Failed to fetch GP51 device tree:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch devices'
      };
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      console.log('🔍 Fetching GP51 positions for devices:', deviceIds);

      // Check cache first
      const cacheKey = `positions-${deviceIds?.join(',') || 'all'}`;
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('✅ Using cached position data');
        return cached;
      }

      // Make real API call using correct action
      const result = await this.makeAuthenticatedRequest(GP51_ACTIONS.POSITIONS, {
        deviceIds: deviceIds || []
      });

      let positions: GP51Position[] = [];

      if (result.positions && Array.isArray(result.positions)) {
        positions = result.positions.filter((pos: GP51Position) => {
          // Filter by device IDs if specified
          if (deviceIds && deviceIds.length > 0) {
            return deviceIds.includes(pos.deviceid);
          }
          return true;
        });
      }

      // Cache the result
      this.setCache(cacheKey, positions, 60000); // 1 minute cache for positions

      console.log(`✅ Fetched ${positions.length} positions`);
      return positions;

    } catch (error) {
      console.error('💥 Failed to fetch GP51 positions:', error);
      return [];
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    return this.getPositions(deviceIds);
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we have valid authentication
      if (!supabaseGP51AuthService.isAuthenticated) {
        return {
          success: false,
          error: 'Not authenticated with GP51'
        };
      }

      // Try to fetch device tree as a connection test
      const result = await this.queryMonitorList();
      return {
        success: result.success,
        error: result.error
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // Clear cache when needed
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 GP51 cache cleared');
  }
}

export const gp51DataService = new GP51DataService();
