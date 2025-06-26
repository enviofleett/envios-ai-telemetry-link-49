
import { supabase } from '@/integrations/supabase/client';
import type { 
  GP51DeviceData, 
  GP51ProcessResult, 
  GP51LiveVehiclesResponse,
  GP51ProcessedPosition,
  GP51AuthResponse,
  GP51Position,
  GP51ServiceResponse
} from '@/types/gp51-unified';

export class UnifiedGP51Service {
  private static instance: UnifiedGP51Service;
  private isAuthenticatedFlag = false;
  private sessionData: any = null;

  static getInstance(): UnifiedGP51Service {
    if (!UnifiedGP51Service.instance) {
      UnifiedGP51Service.instance = new UnifiedGP51Service();
    }
    return UnifiedGP51Service.instance;
  }

  private constructor() {}

  get isAuthenticated(): boolean {
    return this.isAuthenticatedFlag;
  }

  get isConnected(): boolean {
    return this.isAuthenticatedFlag;
  }

  get session(): any {
    return this.sessionData;
  }

  async connect(): Promise<boolean> {
    return this.isAuthenticatedFlag;
  }

  async disconnect(): Promise<void> {
    this.isAuthenticatedFlag = false;
    this.sessionData = null;
  }

  async getConnectionHealth(): Promise<any> {
    return { 
      status: this.isAuthenticatedFlag ? 'healthy' : 'disconnected',
      timestamp: new Date()
    };
  }

  async logout(): Promise<void> {
    this.isAuthenticatedFlag = false;
    this.sessionData = null;
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      console.log(`🔐 Authenticating with GP51 as: ${username}`);
      
      const { data, error } = await supabase.functions.invoke('gp51-hybrid-auth', {
        body: { username, password }
      });
      
      if (error) {
        console.error('❌ Authentication failed:', error);
        return { 
          success: false, 
          status: 'error',
          error: error.message,
          cause: 'api_error'
        };
      }

      if (data?.success) {
        this.isAuthenticatedFlag = true;
        this.sessionData = data;
        console.log('✅ GP51 authentication successful');
        return { 
          success: true, 
          status: 'authenticated',
          cause: 'success'
        };
      } else {
        const errorMsg = data?.error || 'Authentication failed';
        console.error('❌ GP51 authentication failed:', errorMsg);
        return { 
          success: false, 
          status: 'failed',
          error: errorMsg,
          cause: 'auth_failed'
        };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication error';
      console.error('❌ GP51 authentication error:', errorMsg);
      return { 
        success: false, 
        status: 'error',
        error: errorMsg,
        cause: 'exception'
      };
    }
  }

  async authenticateAdmin(username: string, password: string): Promise<GP51AuthResponse> {
    return this.authenticate(username, password);
  }

  async queryMonitorList(): Promise<GP51ServiceResponse<GP51DeviceData[]>> {
    try {
      console.log('🔄 Querying GP51 monitor list...');
      
      const { data, error } = await supabase.functions.invoke('gp51-device-list');
      
      if (error) {
        console.error('❌ Failed to query monitor list:', error);
        return { 
          success: false, 
          error: error.message,
          status: 'error'
        };
      }

      if (data?.success) {
        const devices: GP51DeviceData[] = (data.devices || []).map((device: any) => ({
          deviceId: device.deviceid || device.deviceId,
          deviceName: device.devicename || device.deviceName || device.name,
          deviceType: device.devicetype?.toString() || 'unknown',
          simNumber: device.simnum,
          groupId: device.groupId?.toString(),
          groupName: device.groupName,
          isActive: device.isfree !== 1,
          lastActiveTime: device.lastactivetime
        }));

        console.log(`✅ Successfully queried ${devices.length} devices`);
        return { 
          success: true, 
          data: devices,
          status: 'ok'
        };
      } else {
        const errorMsg = data?.error || 'Failed to query monitor list';
        console.error('❌ Monitor list query failed:', errorMsg);
        return { 
          success: false, 
          error: errorMsg,
          status: 'failed'
        };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Query failed';
      console.error('❌ Monitor list query error:', errorMsg);
      return { 
        success: false, 
        error: errorMsg,
        status: 'error'
      };
    }
  }

  async getDevices(deviceIds?: string[]): Promise<GP51ServiceResponse<GP51DeviceData[]>> {
    return this.queryMonitorList();
  }

  async getLastPositions(deviceIds: string[]): Promise<GP51ProcessedPosition[]> {
    try {
      console.log(`🔄 Getting last positions for ${deviceIds.length} devices...`);
      
      // Mock implementation - replace with actual GP51 API call
      const positions: GP51ProcessedPosition[] = deviceIds.map(deviceId => ({
        deviceId,
        deviceName: `Device ${deviceId}`,
        latitude: 0,
        longitude: 0,
        speed: 0,
        course: 0,
        timestamp: new Date(),
        status: 'active',
        isMoving: false,
        statusText: 'active'
      }));

      return positions;
    } catch (err) {
      console.error('❌ Error getting last positions:', err);
      return [];
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      const processedPositions = await this.getLastPositions(deviceIds || []);
      
      return processedPositions.map(pos => ({
        deviceId: pos.deviceId,
        latitude: pos.latitude,
        longitude: pos.longitude,
        timestamp: pos.timestamp.getTime(), // Convert Date to number
        speed: pos.speed,
        course: pos.course,
        status: pos.status,
        isMoving: pos.isMoving,
        statusText: pos.statusText,
        address: ''
      }));
    } catch (err) {
      console.error('❌ Error getting positions:', err);
      return [];
    }
  }

  async loadExistingSession(): Promise<boolean> {
    try {
      // Check if there's an existing valid session
      const { data, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('is_active', true)
        .gt('token_expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking existing session:', error);
        return false;
      }

      if (data) {
        this.isAuthenticatedFlag = true;
        this.sessionData = data;
        console.log('✅ Loaded existing GP51 session');
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error loading existing session:', err);
      return false;
    }
  }
}

export const unifiedGP51Service = UnifiedGP51Service.getInstance();
