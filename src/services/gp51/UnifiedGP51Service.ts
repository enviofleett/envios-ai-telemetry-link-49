
import { supabase } from '@/integrations/supabase/client';

// Unified GP51 Service - Single source of truth for all GP51 operations
export interface GP51Session {
  id: string;
  username: string;
  token: string;
  expiresAt: Date;
  lastValidated: Date;
  isValid: boolean;
  apiUrl: string;
}

export interface GP51ServiceResult {
  success: boolean;
  error?: string;
  data?: any;
}

export interface GP51ConnectionConfig {
  username: string;
  password: string;
  apiUrl?: string;
}

export interface GP51User {
  username: string;
  password: string;
  usertype: number;
  multilogin: number;
  email?: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  wechat?: string;
  qq?: string;
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  creater: string;
  groupid?: number;
}

export interface GP51Position {
  deviceid: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  altitude: number;
  timestamp: string;
  status: string;
}

export class UnifiedGP51Service {
  private static instance: UnifiedGP51Service;
  private currentSession: GP51Session | null = null;
  private sessionSubscribers: ((session: GP51Session | null) => void)[] = [];
  private readonly API_BASE_URL = 'https://www.gps51.com/webapi';

  private constructor() {}

  static getInstance(): UnifiedGP51Service {
    if (!UnifiedGP51Service.instance) {
      UnifiedGP51Service.instance = new UnifiedGP51Service();
    }
    return UnifiedGP51Service.instance;
  }

  // ========== AUTHENTICATION & SESSION MANAGEMENT ==========

  async authenticateAdmin(username: string, password: string): Promise<GP51ServiceResult> {
    try {
      console.log('🔐 [UnifiedGP51] Starting admin authentication for:', username);

      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'authenticate-gp51',
          username,
          password,
          apiUrl: this.API_BASE_URL
        }
      });

      if (error) {
        console.error('❌ [UnifiedGP51] Authentication error:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        console.error('❌ [UnifiedGP51] Authentication failed:', data.error);
        return { success: false, error: data.error };
      }

      // Create session object
      const session: GP51Session = {
        id: data.sessionId || crypto.randomUUID(),
        username,
        token: data.token,
        expiresAt: new Date(data.expiresAt),
        lastValidated: new Date(),
        isValid: true,
        apiUrl: this.API_BASE_URL
      };

      this.currentSession = session;
      this.notifySessionSubscribers(session);

      console.log('✅ [UnifiedGP51] Admin authentication successful');
      return { success: true, data: session };

    } catch (error) {
      console.error('❌ [UnifiedGP51] Authentication exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async refreshSession(): Promise<GP51ServiceResult> {
    try {
      console.log('🔄 [UnifiedGP51] Refreshing session...');

      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'smart-session-refresh' }
      });

      if (error || !data.refreshed) {
        return { success: false, error: data?.error || 'Session refresh failed' };
      }

      console.log('✅ [UnifiedGP51] Session refreshed successfully');
      return { success: true, data: data };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh error'
      };
    }
  }

  async validateSession(): Promise<boolean> {
    if (!this.currentSession) return false;

    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'enhanced-gp51-status' }
      });

      return !error && data?.connected && !data?.isExpired;
    } catch (error) {
      console.error('❌ [UnifiedGP51] Session validation failed:', error);
      return false;
    }
  }

  // ========== USER MANAGEMENT ==========

  async addUser(userData: GP51User): Promise<GP51ServiceResult> {
    try {
      console.log('👤 [UnifiedGP51] Adding new user:', userData.username);

      if (!this.currentSession?.token) {
        return { success: false, error: 'No active session' };
      }

      const response = await fetch(`${this.API_BASE_URL}?action=adduser&token=${this.currentSession.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userData.username,
          password: userData.password, // Should be MD5 hashed
          usertype: userData.usertype || 11, // Default to end user
          multilogin: userData.multilogin || 1,
          email: userData.email || '',
          companyname: userData.companyName || '',
          contactname: userData.contactName || '',
          phone: userData.phone || '',
          wechat: userData.wechat || '',
          qq: userData.qq || ''
        })
      });

      const result = await response.json();

      if (result.status === 0) {
        console.log('✅ [UnifiedGP51] User added successfully');
        return { success: true, data: result };
      } else {
        console.error('❌ [UnifiedGP51] Add user failed:', result.cause);
        return { success: false, error: result.cause || 'Add user failed' };
      }

    } catch (error) {
      console.error('❌ [UnifiedGP51] Add user exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Add user failed'
      };
    }
  }

  async queryUserDetail(username: string): Promise<GP51ServiceResult> {
    try {
      if (!this.currentSession?.token) {
        return { success: false, error: 'No active session' };
      }

      const response = await fetch(`${this.API_BASE_URL}?action=queryuserdetail&token=${this.currentSession.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const result = await response.json();

      if (result.status === 0) {
        return { success: true, data: result };
      } else {
        return { success: false, error: result.cause || 'Query user failed' };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query user failed'
      };
    }
  }

  // ========== DEVICE/VEHICLE MANAGEMENT ==========

  async addDevice(deviceData: GP51Device): Promise<GP51ServiceResult> {
    try {
      console.log('🚗 [UnifiedGP51] Adding new device:', deviceData.deviceid);

      if (!this.currentSession?.token) {
        return { success: false, error: 'No active session' };
      }

      const response = await fetch(`${this.API_BASE_URL}?action=adddevice&token=${this.currentSession.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceid: deviceData.deviceid,
          devicename: deviceData.devicename,
          devicetype: deviceData.devicetype,
          creater: deviceData.creater,
          groupid: deviceData.groupid || 0
        })
      });

      const result = await response.json();

      if (result.status === 0) {
        console.log('✅ [UnifiedGP51] Device added successfully');
        return { success: true, data: result };
      } else {
        console.error('❌ [UnifiedGP51] Add device failed:', result.cause);
        return { success: false, error: result.cause || 'Add device failed' };
      }

    } catch (error) {
      console.error('❌ [UnifiedGP51] Add device exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Add device failed'
      };
    }
  }

  async queryMonitorList(): Promise<GP51ServiceResult> {
    try {
      console.log('📋 [UnifiedGP51] Querying monitor list...');

      if (!this.currentSession?.token) {
        return { success: false, error: 'No active session' };
      }

      const response = await fetch(`${this.API_BASE_URL}?action=querymonitorlist&token=${this.currentSession.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (result.status === 0) {
        console.log('✅ [UnifiedGP51] Monitor list retrieved successfully');
        return { success: true, data: result };
      } else {
        console.error('❌ [UnifiedGP51] Query monitor list failed:', result.cause);
        return { success: false, error: result.cause || 'Query monitor list failed' };
      }

    } catch (error) {
      console.error('❌ [UnifiedGP51] Query monitor list exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query monitor list failed'
      };
    }
  }

  // ========== REAL-TIME TRACKING ==========

  async getLastPosition(deviceIds?: string[]): Promise<GP51ServiceResult> {
    try {
      console.log('📍 [UnifiedGP51] Getting last positions...');

      if (!this.currentSession?.token) {
        return { success: false, error: 'No active session' };
      }

      const response = await fetch(`${this.API_BASE_URL}?action=lastposition&token=${this.currentSession.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceids: deviceIds?.join(',') || ''
        })
      });

      const result = await response.json();

      if (result.status === 0) {
        console.log('✅ [UnifiedGP51] Last positions retrieved successfully');
        return { success: true, data: result.records || [] };
      } else {
        console.error('❌ [UnifiedGP51] Get last position failed:', result.cause);
        return { success: false, error: result.cause || 'Get last position failed' };
      }

    } catch (error) {
      console.error('❌ [UnifiedGP51] Get last position exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get last position failed'
      };
    }
  }

  async queryTracks(deviceId: string, startTime: string, endTime: string): Promise<GP51ServiceResult> {
    try {
      console.log('🛤️ [UnifiedGP51] Querying tracks for device:', deviceId);

      if (!this.currentSession?.token) {
        return { success: false, error: 'No active session' };
      }

      const response = await fetch(`${this.API_BASE_URL}?action=querytracks&token=${this.currentSession.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceid: deviceId,
          starttime: startTime,
          endtime: endTime
        })
      });

      const result = await response.json();

      if (result.status === 0) {
        console.log('✅ [UnifiedGP51] Tracks retrieved successfully');
        return { success: true, data: result.tracks || [] };
      } else {
        console.error('❌ [UnifiedGP51] Query tracks failed:', result.cause);
        return { success: false, error: result.cause || 'Query tracks failed' };
      }

    } catch (error) {
      console.error('❌ [UnifiedGP51] Query tracks exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Query tracks failed'
      };
    }
  }

  // ========== VEHICLE COMMANDS ==========

  async sendCommand(deviceId: string, command: string, params?: any): Promise<GP51ServiceResult> {
    try {
      console.log('📡 [UnifiedGP51] Sending command to device:', deviceId, command);

      if (!this.currentSession?.token) {
        return { success: false, error: 'No active session' };
      }

      const response = await fetch(`${this.API_BASE_URL}?action=sendcmd&token=${this.currentSession.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceid: deviceId,
          command: command,
          params: params || {}
        })
      });

      const result = await response.json();

      if (result.status === 0) {
        console.log('✅ [UnifiedGP51] Command sent successfully');
        return { success: true, data: result };
      } else {
        console.error('❌ [UnifiedGP51] Send command failed:', result.cause);
        return { success: false, error: result.cause || 'Send command failed' };
      }

    } catch (error) {
      console.error('❌ [UnifiedGP51] Send command exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Send command failed'
      };
    }
  }

  async disableEngine(deviceId: string): Promise<GP51ServiceResult> {
    return this.sendCommand(deviceId, 'disable_engine');
  }

  async enableEngine(deviceId: string): Promise<GP51ServiceResult> {
    return this.sendCommand(deviceId, 'enable_engine');
  }

  async batchOperate(deviceIds: string[], operation: string, params?: any): Promise<GP51ServiceResult> {
    try {
      console.log('📦 [UnifiedGP51] Batch operation:', operation, 'for', deviceIds.length, 'devices');

      if (!this.currentSession?.token) {
        return { success: false, error: 'No active session' };
      }

      const response = await fetch(`${this.API_BASE_URL}?action=batchoperate&token=${this.currentSession.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceids: deviceIds.join(','),
          operation: operation,
          params: params || {}
        })
      });

      const result = await response.json();

      if (result.status === 0) {
        console.log('✅ [UnifiedGP51] Batch operation completed successfully');
        return { success: true, data: result };
      } else {
        console.error('❌ [UnifiedGP51] Batch operation failed:', result.cause);
        return { success: false, error: result.cause || 'Batch operation failed' };
      }

    } catch (error) {
      console.error('❌ [UnifiedGP51] Batch operation exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch operation failed'
      };
    }
  }

  // ========== CONNECTION TESTING ==========

  async testConnection(): Promise<GP51ServiceResult> {
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'comprehensive-health-check' }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: data.isHealthy,
        error: data.isHealthy ? undefined : data.message,
        data: data
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // ========== SESSION MANAGEMENT ==========

  subscribeToSession(callback: (session: GP51Session | null) => void): () => void {
    this.sessionSubscribers.push(callback);
    
    // Immediately call with current session
    callback(this.currentSession);
    
    return () => {
      const index = this.sessionSubscribers.indexOf(callback);
      if (index > -1) {
        this.sessionSubscribers.splice(index, 1);
      }
    };
  }

  private notifySessionSubscribers(session: GP51Session | null): void {
    this.sessionSubscribers.forEach(callback => callback(session));
  }

  getCurrentSession(): GP51Session | null {
    return this.currentSession;
  }

  isSessionValid(): boolean {
    if (!this.currentSession) return false;
    return this.currentSession.expiresAt > new Date();
  }

  async disconnect(): Promise<void> {
    try {
      await supabase.functions.invoke('settings-management', {
        body: { action: 'clear-gp51-sessions' }
      });

      this.currentSession = null;
      this.notifySessionSubscribers(null);
      
      console.log('✅ [UnifiedGP51] Disconnected successfully');
    } catch (error) {
      console.error('❌ [UnifiedGP51] Disconnect error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const unifiedGP51Service = UnifiedGP51Service.getInstance();
