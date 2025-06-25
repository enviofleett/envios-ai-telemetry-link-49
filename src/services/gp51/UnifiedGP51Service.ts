
import { supabase } from '@/integrations/supabase/client';

export interface GP51ConnectionConfig {
  username: string;
  password: string;
  apiUrl?: string;
}

export interface GP51Session {
  token: string;
  username: string;
  apiUrl: string;
  expiresAt: Date;
  isValid: boolean;
}

export interface GP51ServiceResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

export interface GP51DeviceData {
  deviceid: string;
  devicename: string;
  groupname: string;
  username: string;
  devicetype: number;
  devicetypename: string;
  is_free: number;
  status: string;
  lastposition?: any;
}

class UnifiedGP51Service {
  private currentSession: GP51Session | null = null;
  private sessionCallbacks: Set<(session: GP51Session | null) => void> = new Set();

  constructor() {
    this.loadStoredSession();
  }

  // Session management
  subscribeToSession(callback: (session: GP51Session | null) => void): () => void {
    this.sessionCallbacks.add(callback);
    callback(this.currentSession); // Immediate callback with current state
    
    return () => {
      this.sessionCallbacks.delete(callback);
    };
  }

  private notifySessionChange(): void {
    this.sessionCallbacks.forEach(callback => callback(this.currentSession));
  }

  private async loadStoredSession(): Promise<void> {
    try {
      const { data: session, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session && !error) {
        const expiresAt = new Date(session.token_expires_at);
        const isValid = expiresAt > new Date();
        
        if (isValid) {
          this.currentSession = {
            token: session.gp51_token,
            username: session.username,
            apiUrl: session.api_url,
            expiresAt,
            isValid: true
          };
          this.notifySessionChange();
        }
      }
    } catch (error) {
      console.error('❌ Failed to load stored session:', error);
    }
  }

  // Authentication
  async authenticate(config: GP51ConnectionConfig): Promise<GP51ServiceResult> {
    try {
      console.log('🔐 [UNIFIED-GP51] Starting authentication...');
      
      const { data, error } = await supabase.functions.invoke('gp51-hybrid-auth', {
        body: {
          action: 'authenticate',
          username: config.username,
          password: config.password,
          apiUrl: config.apiUrl || 'https://www.gps51.com'
        }
      });

      if (error) {
        console.error('❌ [UNIFIED-GP51] Authentication error:', error);
        return { success: false, error: error.message };
      }

      if (!data?.success) {
        console.error('❌ [UNIFIED-GP51] Authentication failed:', data?.error);
        return { success: false, error: data?.error || 'Authentication failed' };
      }

      // Update current session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 23); // GP51 tokens last ~24 hours

      this.currentSession = {
        token: data.token,
        username: data.username,
        apiUrl: data.apiUrl,
        expiresAt,
        isValid: true
      };

      this.notifySessionChange();
      console.log('✅ [UNIFIED-GP51] Authentication successful');
      
      return {
        success: true,
        data: {
          username: data.username,
          apiUrl: data.apiUrl,
          expiresAt: expiresAt.toISOString()
        }
      };

    } catch (error) {
      console.error('❌ [UNIFIED-GP51] Authentication exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  // Connection testing
  async testConnection(): Promise<GP51ServiceResult> {
    try {
      console.log('🧪 [UNIFIED-GP51] Testing connection...');
      
      if (!this.isSessionValid()) {
        return { success: false, error: 'No valid session. Please authenticate first.' };
      }

      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_gp51_api' }
      });

      if (error) {
        console.error('❌ [UNIFIED-GP51] Connection test error:', error);
        return { success: false, error: error.message };
      }

      if (data?.isValid) {
        console.log('✅ [UNIFIED-GP51] Connection test successful');
        return {
          success: true,
          data: {
            deviceCount: data.deviceCount || 0,
            username: data.username,
            latency: data.latency,
            status: data.status
          }
        };
      } else {
        console.error('❌ [UNIFIED-GP51] Connection test failed:', data);
        return {
          success: false,
          error: data?.errorMessage || 'Connection test failed'
        };
      }

    } catch (error) {
      console.error('❌ [UNIFIED-GP51] Connection test exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  // The missing queryMonitorList method that was causing the error
  async queryMonitorList(): Promise<GP51ServiceResult> {
    try {
      console.log('📋 [UNIFIED-GP51] Querying monitor list...');
      
      if (!this.isSessionValid()) {
        return { success: false, error: 'No valid session. Please authenticate first.' };
      }

      const { data, error } = await supabase.functions.invoke('gp51-device-management', {
        body: { action: 'querymonitorlist' }
      });

      if (error) {
        console.error('❌ [UNIFIED-GP51] Monitor list query error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        console.log('✅ [UNIFIED-GP51] Monitor list retrieved successfully');
        return {
          success: true,
          data: data.data || data.devices || []
        };
      } else {
        console.error('❌ [UNIFIED-GP51] Monitor list query failed:', data);
        return {
          success: false,
          error: data?.error || 'Failed to retrieve monitor list'
        };
      }

    } catch (error) {
      console.error('❌ [UNIFIED-GP51] Monitor list query exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Monitor list query failed'
      };
    }
  }

  // Get last position data
  async queryLastPosition(deviceIds?: string[]): Promise<GP51ServiceResult> {
    try {
      console.log('📍 [UNIFIED-GP51] Querying last positions...');
      
      if (!this.isSessionValid()) {
        return { success: false, error: 'No valid session. Please authenticate first.' };
      }

      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: { deviceIds }
      });

      if (error) {
        console.error('❌ [UNIFIED-GP51] Last position query error:', error);
        return { success: false, error: error.message };
      }

      if (data?.success) {
        console.log('✅ [UNIFIED-GP51] Last positions retrieved successfully');
        return {
          success: true,
          data: data.data
        };
      } else {
        console.error('❌ [UNIFIED-GP51] Last position query failed:', data);
        return {
          success: false,
          error: data?.error || 'Failed to retrieve last positions'
        };
      }

    } catch (error) {
      console.error('❌ [UNIFIED-GP51] Last position query exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Last position query failed'
      };
    }
  }

  // Session refresh
  async refreshSession(): Promise<GP51ServiceResult> {
    try {
      console.log('🔄 [UNIFIED-GP51] Refreshing session...');
      
      if (!this.currentSession) {
        return { success: false, error: 'No current session to refresh' };
      }

      // Force reload from database
      await this.loadStoredSession();
      
      if (this.isSessionValid()) {
        console.log('✅ [UNIFIED-GP51] Session refreshed successfully');
        return { success: true };
      } else {
        console.log('⚠️ [UNIFIED-GP51] Session expired, re-authentication required');
        return { success: false, error: 'Session expired. Please re-authenticate.' };
      }

    } catch (error) {
      console.error('❌ [UNIFIED-GP51] Session refresh exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh failed'
      };
    }
  }

  // Session validation
  isSessionValid(): boolean {
    if (!this.currentSession) return false;
    return this.currentSession.isValid && this.currentSession.expiresAt > new Date();
  }

  getCurrentSession(): GP51Session | null {
    return this.isSessionValid() ? this.currentSession : null;
  }

  // Terminate session
  async terminate(): Promise<void> {
    try {
      console.log('🔚 [UNIFIED-GP51] Terminating session...');
      
      // Clear session from database
      await supabase
        .from('gp51_sessions')
        .update({ is_active: false })
        .eq('is_active', true);

      // Clear local session
      this.currentSession = null;
      this.notifySessionChange();
      
      console.log('✅ [UNIFIED-GP51] Session terminated');
    } catch (error) {
      console.error('❌ [UNIFIED-GP51] Session termination error:', error);
    }
  }

  // Health monitoring
  async getConnectionHealth(): Promise<{
    isConnected: boolean;
    isReallyConnected: boolean;
    sessionValid: boolean;
    apiReachable: boolean;
    dataFlowing: boolean;
    errorMessage?: string;
    deviceCount?: number;
    lastCheck: Date;
  }> {
    const now = new Date();
    
    try {
      const sessionValid = this.isSessionValid();
      
      if (!sessionValid) {
        return {
          isConnected: false,
          isReallyConnected: false,
          sessionValid: false,
          apiReachable: false,
          dataFlowing: false,
          errorMessage: 'No valid session',
          lastCheck: now
        };
      }

      // Test API connectivity
      const connectionTest = await this.testConnection();
      const isApiReachable = connectionTest.success;
      
      // Test data flow
      const dataTest = await this.queryMonitorList();
      const isDataFlowing = dataTest.success;
      
      return {
        isConnected: sessionValid && isApiReachable,
        isReallyConnected: sessionValid && isApiReachable && isDataFlowing,
        sessionValid,
        apiReachable: isApiReachable,
        dataFlowing: isDataFlowing,
        errorMessage: !isApiReachable ? connectionTest.error : (!isDataFlowing ? dataTest.error : undefined),
        deviceCount: connectionTest.data?.deviceCount || dataTest.data?.length || 0,
        lastCheck: now
      };
      
    } catch (error) {
      return {
        isConnected: false,
        isReallyConnected: false,
        sessionValid: this.isSessionValid(),
        apiReachable: false,
        dataFlowing: false,
        errorMessage: error instanceof Error ? error.message : 'Health check failed',
        lastCheck: now
      };
    }
  }
}

// Export singleton instance
export const unifiedGP51Service = new UnifiedGP51Service();
export default unifiedGP51Service;
