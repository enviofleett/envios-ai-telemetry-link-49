import { supabase } from '@/integrations/supabase/client';
import { GP51HealthStatus, GP51AuthResponse, GP51DeviceData, GP51Position, GP51Group } from '@/types/gp51-unified';

export class UnifiedGP51Service {
  public session: any = null;
  private currentUser: string | null = null;
  public isAuthenticated: boolean = false;

  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51DeviceData[];
    groups?: GP51Group[];
    error?: string;
  }> {
    try {
      console.log('🔍 Querying monitor list...');
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'querymonitorlist' }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('📊 Monitor list response:', data);

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Failed to query monitor list',
          data: [],
          groups: []
        };
      }

      const groups = data?.groups || [];
      const devices = data?.devices || groups.flatMap((group: any) => group.devices || []);

      console.log('✅ Successfully fetched:', {
        groupCount: groups.length,
        deviceCount: devices.length
      });

      return {
        success: true,
        data: devices,
        groups: groups
      };
    } catch (error) {
      console.error('Failed to query monitor list:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        groups: []
      };
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    return this.getPositions(deviceIds);
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      console.log('📍 Getting positions for devices:', deviceIds);
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'getpositions',
          deviceIds: deviceIds 
        }
      });

      if (error) throw error;

      return data?.positions || [];
    } catch (error) {
      console.error('Failed to get positions:', error);
      return [];
    }
  }

  async loadExistingSession(): Promise<boolean> {
    try {
      const storedSession = localStorage.getItem('gp51_session');
      if (!storedSession) return false;

      const sessionData = JSON.parse(storedSession);
      
      // Validate session is still active
      const isValid = await this.validateSession(sessionData);
      if (isValid) {
        this.session = sessionData;
        this.isAuthenticated = true;
        this.currentUser = sessionData.username;
        return true;
      }
      
      localStorage.removeItem('gp51_session');
      return false;
    } catch (error) {
      console.error('Failed to load existing session:', error);
      return false;
    }
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    try {
      const start = Date.now();
      
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'health_check' }
      });
      
      const responseTime = Date.now() - start;
      
      if (error || !data?.success) {
        return {
          status: 'failed',
          lastCheck: new Date(),
          responseTime,
          errors: [error?.message || 'Health check failed'],
          isConnected: false,
          lastPingTime: new Date(),
          tokenValid: false,
          sessionValid: false,
          activeDevices: 0,
          errorMessage: error?.message || 'Health check failed'
        };
      }
      
      return {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime,
        isConnected: this.isAuthenticated,
        lastPingTime: new Date(),
        tokenValid: !!this.session?.token,
        sessionValid: await this.validateSession(this.session),
        activeDevices: data.activeDevices || 0,
        errorMessage: undefined
      };
    } catch (error) {
      return {
        status: 'failed',
        lastCheck: new Date(),
        responseTime: 0,
        errors: [error.message],
        isConnected: false,
        lastPingTime: new Date(),
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errorMessage: error.message
      };
    }
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      console.log('🔐 Authenticating with GP51...');
      
      const { data, error } = await supabase.functions.invoke('gp51-hybrid-auth', {
        body: { username, password }
      });

      if (error) {
        return {
          success: false,
          status: 'error',
          error: error.message,
          cause: 'Authentication request failed'
        };
      }

      if (!data.success) {
        return {
          success: false,
          status: 'error',
          error: data.error || 'Authentication failed',
          cause: data.details
        };
      }

      // Store session
      this.session = {
        token: data.token,
        username,
        expiresAt: data.expiresAt
      };
      this.currentUser = username;
      this.isAuthenticated = true;

      // Persist session
      localStorage.setItem('gp51_session', JSON.stringify(this.session));

      return {
        success: true,
        status: 'authenticated',
        token: data.token,
        username: username
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message,
        cause: 'Network error'
      };
    }
  }

  async connect(): Promise<boolean> {
    return await this.loadExistingSession();
  }

  async disconnect(): Promise<void> {
    this.session = null;
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('gp51_session');
  }

  async logout(): Promise<void> {
    try {
      if (this.session?.token) {
        await supabase.functions.invoke('gp51-service-management', {
          body: { action: 'logout' }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.disconnect();
    }
  }

  async getDevices(deviceIds?: string[]) {
    const result = await this.queryMonitorList();
    
    return {
      success: result.success,
      data: result.data || [],
      groups: result.groups || [],
      error: result.error
    };
  }

  private async validateSession(sessionData: any): Promise<boolean> {
    try {
      if (!sessionData?.expiresAt) return false;
      
      const expiry = new Date(sessionData.expiresAt);
      if (expiry <= new Date()) return false;

      return true;
    } catch {
      return false;
    }
  }
}

// Create and export singleton instance
export const unifiedGP51Service = new UnifiedGP51Service();
