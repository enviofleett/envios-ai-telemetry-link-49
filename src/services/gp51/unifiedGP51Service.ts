
import { supabase } from '@/integrations/supabase/client';

export interface GP51ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GP51SessionInfo {
  username: string;
  expiresAt: string;
  isConnected: boolean;
  isExpired: boolean;
}

class UnifiedGP51Service {
  private static instance: UnifiedGP51Service;

  static getInstance(): UnifiedGP51Service {
    if (!UnifiedGP51Service.instance) {
      UnifiedGP51Service.instance = new UnifiedGP51Service();
    }
    return UnifiedGP51Service.instance;
  }

  async authenticate(username: string, password: string): Promise<GP51ServiceResult<GP51SessionInfo>> {
    console.log('🔐 UnifiedGP51Service: Authenticating with GP51...');
    
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: username.trim(),
          password
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

      return {
        success: true,
        data: {
          username: data.session?.username || username.trim(),
          expiresAt: data.session?.expiresAt,
          isConnected: true,
          isExpired: false
        }
      };

    } catch (error) {
      console.error('❌ Authentication exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

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
