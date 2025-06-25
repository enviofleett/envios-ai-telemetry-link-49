
import { supabase } from '@/integrations/supabase/client';

export interface GP51ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GP51ConnectionConfig {
  username: string;
  password: string;
  apiUrl: string;
}

export interface GP51Session {
  username: string;
  expiresAt: string;
  isConnected: boolean;
  isExpired: boolean;
  sessionId?: string;
  token?: string;
}

export interface GP51SessionInfo {
  username: string;
  expiresAt: string;
  isConnected: boolean;
  isExpired: boolean;
}

class UnifiedGP51Service {
  private static instance: UnifiedGP51Service;
  private session: GP51Session | null = null;
  private sessionSubscribers: Array<(session: GP51Session | null) => void> = [];

  static getInstance(): UnifiedGP51Service {
    if (!UnifiedGP51Service.instance) {
      UnifiedGP51Service.instance = new UnifiedGP51Service();
    }
    return UnifiedGP51Service.instance;
  }

  subscribeToSession(callback: (session: GP51Session | null) => void): () => void {
    this.sessionSubscribers.push(callback);
    // Immediately call with current session
    callback(this.session);
    
    return () => {
      this.sessionSubscribers = this.sessionSubscribers.filter(sub => sub !== callback);
    };
  }

  private notifySessionSubscribers() {
    this.sessionSubscribers.forEach(callback => callback(this.session));
  }

  isSessionValid(): boolean {
    if (!this.session) return false;
    const now = new Date();
    const expiresAt = new Date(this.session.expiresAt);
    return now < expiresAt && this.session.isConnected && !this.session.isExpired;
  }

  async authenticate(config: GP51ConnectionConfig): Promise<GP51ServiceResult<GP51Session>> {
    console.log('🔐 UnifiedGP51Service: Authenticating with GP51...');
    
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: config.username.trim(),
          password: config.password,
          apiUrl: config.apiUrl
        }
      });

      if (error) {
        console.error('❌ Authentication error:', error);
        return {
          success: false,
          error: error.message || 'Authentication failed'
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Authentication failed'
        };
      }

      // Update local session
      this.session = {
        username: data.session?.username || config.username.trim(),
        expiresAt: data.session?.expiresAt || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        isConnected: true,
        isExpired: false,
        sessionId: data.session?.sessionId,
        token: data.session?.token
      };

      this.notifySessionSubscribers();

      return {
        success: true,
        data: this.session
      };

    } catch (error) {
      console.error('❌ Authentication exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async testConnection(): Promise<GP51ServiceResult> {
    console.log('🧪 UnifiedGP51Service: Testing GP51 connection...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        console.error('❌ Connection test error:', error);
        return {
          success: false,
          error: error.message || 'Connection test failed'
        };
      }

      return {
        success: data.success || false,
        data: data,
        error: data.error
      };

    } catch (error) {
      console.error('❌ Connection test exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  async queryMonitorList(): Promise<GP51ServiceResult> {
    console.log('📋 UnifiedGP51Service: Querying monitor list...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'querymonitorlist' }
      });

      if (error) {
        console.error('❌ Monitor list query error:', error);
        return {
          success: false,
          error: error.message || 'Monitor list query failed'
        };
      }

      return {
        success: data.success || false,
        data: data.data,
        error: data.error
      };

    } catch (error) {
      console.error('❌ Monitor list query exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Monitor list query failed'
      };
    }
  }

  async queryLastPosition(deviceIds?: string[]): Promise<GP51ServiceResult> {
    console.log('📍 UnifiedGP51Service: Querying last position...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'querylastposition',
          deviceIds: deviceIds 
        }
      });

      if (error) {
        console.error('❌ Position query error:', error);
        return {
          success: false,
          error: error.message || 'Position query failed'
        };
      }

      return {
        success: data.success || false,
        data: data.data,
        error: data.error
      };

    } catch (error) {
      console.error('❌ Position query exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Position query failed'
      };
    }
  }

  async refreshSession(): Promise<GP51ServiceResult> {
    console.log('🔄 UnifiedGP51Service: Refreshing session...');
    
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'refresh-gp51-session' }
      });

      if (error) {
        console.error('❌ Session refresh error:', error);
        return {
          success: false,
          error: error.message || 'Session refresh failed'
        };
      }

      if (data.success && this.session) {
        // Update session expiry
        this.session.expiresAt = data.session?.expiresAt || new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
        this.session.isExpired = false;
        this.notifySessionSubscribers();
      }

      return {
        success: data.success || false,
        data: data,
        error: data.error
      };

    } catch (error) {
      console.error('❌ Session refresh exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Session refresh failed'
      };
    }
  }

  async getConnectionHealth(): Promise<any> {
    console.log('🏥 UnifiedGP51Service: Getting connection health...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'health_check' }
      });

      if (error) {
        throw new Error(error.message || 'Health check failed');
      }

      return {
        isConnected: data.success || false,
        isReallyConnected: data.success || false,
        sessionValid: this.isSessionValid(),
        apiReachable: data.success || false,
        dataFlowing: data.success || false,
        deviceCount: data.deviceCount || 0,
        errorMessage: data.error,
        lastCheck: new Date()
      };

    } catch (error) {
      console.error('❌ Health check exception:', error);
      throw error;
    }
  }

  async terminate(): Promise<void> {
    console.log('👋 UnifiedGP51Service: Terminating connection...');
    
    try {
      await supabase.functions.invoke('settings-management', {
        body: { action: 'clear-gp51-sessions' }
      });

      // Clear local session
      this.session = null;
      this.notifySessionSubscribers();

    } catch (error) {
      console.error('❌ Terminate error:', error);
      // Still clear local session even if server call fails
      this.session = null;
      this.notifySessionSubscribers();
      throw error;
    }
  }

  // Legacy methods for backward compatibility
  async getConnectionStatus(): Promise<GP51ServiceResult<GP51SessionInfo>> {
    console.log('📊 UnifiedGP51Service: Getting connection status...');
    
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (error) {
        console.error('❌ Status check error:', error);
        return {
          success: false,
          error: error.message || 'Status check failed'
        };
      }

      // Update local session if we have status data
      if (data.username) {
        this.session = {
          username: data.username,
          expiresAt: data.expiresAt,
          isConnected: data.connected && !data.isExpired,
          isExpired: data.isExpired || false
        };
        this.notifySessionSubscribers();
      }

      return {
        success: true,
        data: {
          username: data.username,
          expiresAt: data.expiresAt,
          isConnected: data.connected && !data.isExpired,
          isExpired: data.isExpired || false
        }
      };

    } catch (error) {
      console.error('❌ Status check exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status check failed'
      };
    }
  }

  async disconnect(): Promise<GP51ServiceResult> {
    console.log('👋 UnifiedGP51Service: Disconnecting from GP51...');
    
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'clear-gp51-sessions' }
      });

      if (error) {
        console.error('❌ Disconnect error:', error);
        return {
          success: false,
          error: error.message || 'Disconnect failed'
        };
      }

      // Clear local session
      this.session = null;
      this.notifySessionSubscribers();

      return {
        success: true,
        data: data
      };

    } catch (error) {
      console.error('❌ Disconnect exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Disconnect failed'
      };
    }
  }

  async syncVehicleData(): Promise<GP51ServiceResult> {
    console.log('🔄 UnifiedGP51Service: Syncing vehicle data...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-live-import', {
        body: { action: 'sync_vehicles' }
      });

      if (error) {
        console.error('❌ Vehicle sync error:', error);
        return {
          success: false,
          error: error.message || 'Vehicle sync failed'
        };
      }

      return {
        success: data.success || false,
        data: data,
        error: data.error
      };

    } catch (error) {
      console.error('❌ Vehicle sync exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Vehicle sync failed'
      };
    }
  }
}

export const unifiedGP51Service = UnifiedGP51Service.getInstance();
