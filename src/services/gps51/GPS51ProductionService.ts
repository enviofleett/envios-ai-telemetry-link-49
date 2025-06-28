
import { supabase } from '@/integrations/supabase/client';

export class GPS51ProductionService {
  private static instance: GPS51ProductionService;

  static getInstance(): GPS51ProductionService {
    if (!GPS51ProductionService.instance) {
      GPS51ProductionService.instance = new GPS51ProductionService();
    }
    return GPS51ProductionService.instance;
  }

  async authenticate(username: string, password: string): Promise<{
    success: boolean;
    token?: string;
    username?: string;
    error?: string;
  }> {
    try {
      console.log('🔐 [PRODUCTION-SERVICE] Starting authentication...');

      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'authenticate',
          username,
          password
        }
      });

      if (error) {
        console.error('❌ [PRODUCTION-SERVICE] Authentication error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (data.success) {
        console.log('✅ [PRODUCTION-SERVICE] Authentication successful');
        return {
          success: true,
          token: data.token,
          username: data.username
        };
      } else {
        console.log('❌ [PRODUCTION-SERVICE] Authentication failed:', data.error);
        return {
          success: false,
          error: data.error
        };
      }

    } catch (error) {
      console.error('❌ [PRODUCTION-SERVICE] Authentication exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async getDeviceList(): Promise<{
    success: boolean;
    devices?: any[];
    error?: string;
  }> {
    try {
      console.log('📡 [PRODUCTION-SERVICE] Fetching device list...');

      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'querymonitorlist',
          token: await this.getValidToken()
        }
      });

      if (error) {
        console.error('❌ [PRODUCTION-SERVICE] Device list error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (data.success && data.data.status === 0) {
        console.log(`✅ [PRODUCTION-SERVICE] Retrieved ${data.data.records?.length || 0} devices`);
        return {
          success: true,
          devices: data.data.records || []
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch device list'
        };
      }

    } catch (error) {
      console.error('❌ [PRODUCTION-SERVICE] Device list exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch device list'
      };
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<{
    success: boolean;
    positions?: any[];
    error?: string;
  }> {
    try {
      console.log('📍 [PRODUCTION-SERVICE] Fetching last positions...');

      const params: any = {};
      if (deviceIds && deviceIds.length > 0) {
        params.deviceids = deviceIds.join(',');
      }

      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'lastposition',
          token: await this.getValidToken(),
          params
        }
      });

      if (error) {
        console.error('❌ [PRODUCTION-SERVICE] Last positions error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (data.success && data.data.status === 0) {
        console.log(`✅ [PRODUCTION-SERVICE] Retrieved ${data.data.records?.length || 0} positions`);
        return {
          success: true,
          positions: data.data.records || []
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to fetch positions'
        };
      }

    } catch (error) {
      console.error('❌ [PRODUCTION-SERVICE] Last positions exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch positions'
      };
    }
  }

  async testConnection(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      console.log('🧪 [PRODUCTION-SERVICE] Testing connection...');

      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'test_connection'
        }
      });

      if (error) {
        console.error('❌ [PRODUCTION-SERVICE] Connection test error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log(`${data.success ? '✅' : '❌'} [PRODUCTION-SERVICE] Connection test result: ${data.success}`);
      
      return {
        success: data.success,
        error: data.error
      };

    } catch (error) {
      console.error('❌ [PRODUCTION-SERVICE] Connection test exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  private async getValidToken(): Promise<string> {
    const { data: session, error } = await supabase
      .from('gp51_sessions')
      .select('gp51_token')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !session) {
      throw new Error('No valid GP51 session found');
    }

    return session.gp51_token;
  }
}

export const gps51ProductionService = GPS51ProductionService.getInstance();
