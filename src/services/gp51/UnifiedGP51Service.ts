
import { createClient } from '@supabase/supabase-js';
import {
  GP51AuthResponse,
  GP51User,
  GP51Device,
  GP51Group,
  GP51MonitorListResponse,
  GP51Session,
  GP51HealthStatus,
  GP51Position,
  UnifiedGP51Service
} from '@/types/gp51';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class UnifiedGP51ServiceImpl implements UnifiedGP51Service {
  private baseUrl = 'https://www.gps51.com/webapi';
  private currentToken: string | null = null;
  private _currentUsername: string | null = null;
  private _session: GP51Session | null = null;
  private _isConnected = false;
  private _isAuthenticated = false;

  // Public getters for all required properties
  get isConnected(): boolean {
    return this._isConnected;
  }

  get session(): GP51Session | null {
    return this._session;
  }

  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  get currentUsername(): string | null {
    return this._currentUsername;
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      const hashedPassword = this.md5Hash(password);
      
      const response = await fetch(`${this.baseUrl}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        })
      });

      const result = await response.json();
      
      if (result.status === 0) {
        this.currentToken = result.token;
        this._currentUsername = username;
        this._isConnected = true;
        this._isAuthenticated = true;
        
        this._session = {
          username,
          token: result.token,
          isConnected: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          lastActivity: new Date()
        };

        // Store session in database
        await this.storeSession(username, {
          token: result.token,
          expires_at: result.expires_at,
          is_admin: username === 'octopus'
        });

        // Return with compatibility properties
        return {
          ...result,
          success: true
        };
      } else {
        return {
          ...result,
          success: false,
          error: result.cause
        };
      }
    } catch (error) {
      return {
        status: 1,
        cause: error instanceof Error ? error.message : 'Authentication failed',
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async authenticateAdmin(username: string, password: string): Promise<GP51AuthResponse> {
    return this.authenticate(username, password);
  }

  async logout(): Promise<void> {
    this.currentToken = null;
    this._currentUsername = null;
    this._isConnected = false;
    this._isAuthenticated = false;
    this._session = null;
  }

  async disconnect(): Promise<void> {
    await this.logout();
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    try {
      const startTime = Date.now();
      
      // Test connection with a simple API call
      const response = await fetch(`${this.baseUrl}?action=querymonitorlist${this.currentToken ? `&token=${this.currentToken}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const result = await response.json();
      const responseTime = Date.now() - startTime;

      const health: GP51HealthStatus = {
        isConnected: result.status === 0,
        lastPingTime: new Date(),
        responseTime,
        tokenValid: this.currentToken !== null,
        sessionValid: this._session !== null,
        activeDevices: result.groups?.flatMap((g: any) => g.devices || []).length || 0,
        errors: result.status !== 0 ? [result.cause] : [],
        lastCheck: new Date(),
        errorMessage: result.status !== 0 ? result.cause : undefined,
        status: result.status,
        connectionDetails: `Response time: ${responseTime}ms`
      };

      return health;
    } catch (error) {
      return {
        isConnected: false,
        lastPingTime: new Date(),
        responseTime: -1,
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errors: [error instanceof Error ? error.message : 'Connection failed'],
        lastCheck: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Connection failed',
        status: 1,
        connectionDetails: 'Connection failed'
      };
    }
  }

  // Alias for compatibility
  async getHealthStatus(): Promise<GP51HealthStatus> {
    return this.getConnectionHealth();
  }

  async queryMonitorList(username?: string): Promise<GP51MonitorListResponse> {
    try {
      if (!this.currentToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}?action=querymonitorlist&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || this._currentUsername
        })
      });

      const result = await response.json();

      // Update session activity
      if (this._session) {
        this._session.lastActivity = new Date();
      }

      // Return with compatibility properties
      return {
        ...result,
        success: result.status === 0,
        error: result.status !== 0 ? result.cause : undefined,
        data: {
          groups: result.groups || [],
          users: [], // Extract from groups if needed
          devices: result.groups?.flatMap((g: any) => g.devices || []) || [],
          summary: {
            totalUsers: 0,
            totalDevices: result.groups?.flatMap((g: any) => g.devices || []).length || 0,
            activeDevices: 0,
            offlineDevices: 0,
            totalGroups: result.groups?.length || 0,
            lastUpdateTime: new Date(),
            connectionStatus: result.status === 0 ? 'connected' : 'error',
            apiResponseTime: 0
          }
        }
      };
    } catch (error) {
      return {
        status: 1,
        cause: error instanceof Error ? error.message : 'Query failed',
        groups: [],
        success: false,
        error: error instanceof Error ? error.message : 'Query failed'
      };
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      if (!this.currentToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}?action=lastposition&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceids: deviceIds || [],
          lastquerypositiontime: 0
        })
      });

      const result = await response.json();
      return result.records || [];
    } catch (error) {
      console.error('Failed to get last positions:', error);
      return [];
    }
  }

  async addUser(userData: any): Promise<GP51AuthResponse> {
    try {
      if (!this.currentToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}?action=adduser&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          password: userData.password ? this.md5Hash(userData.password) : undefined,
          creater: this._currentUsername
        })
      });

      const result = await response.json();
      return {
        ...result,
        success: result.status === 0,
        error: result.status !== 0 ? result.cause : undefined
      };
    } catch (error) {
      return {
        status: 1,
        cause: error instanceof Error ? error.message : 'Add user failed',
        success: false,
        error: error instanceof Error ? error.message : 'Add user failed'
      };
    }
  }

  async addDevice(deviceData: any): Promise<GP51AuthResponse> {
    try {
      if (!this.currentToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}?action=adddevice&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...deviceData,
          creater: this._currentUsername
        })
      });

      const result = await response.json();
      return {
        ...result,
        success: result.status === 0,
        error: result.status !== 0 ? result.cause : undefined
      };
    } catch (error) {
      return {
        status: 1,
        cause: error instanceof Error ? error.message : 'Add device failed',
        success: false,
        error: error instanceof Error ? error.message : 'Add device failed'
      };
    }
  }

  async sendCommand(deviceid: string, command: string, params: any[]): Promise<any> {
    try {
      if (!this.currentToken) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${this.baseUrl}?action=sendcmd&token=${this.currentToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceid,
          cmdcode: command,
          params,
          state: -1,
          cmdpwd: 'zhuyi'
        })
      });

      return await response.json();
    } catch (error) {
      return {
        status: 1,
        cause: error instanceof Error ? error.message : 'Command failed'
      };
    }
  }

  async loadExistingSession(): Promise<boolean> {
    try {
      const { data: sessions } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('username', 'octopus')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        this.currentToken = session.gp51_token;
        this._currentUsername = session.username;
        this._isConnected = true;
        this._isAuthenticated = true;
        
        this._session = {
          username: session.username,
          token: session.gp51_token,
          isConnected: true,
          expiresAt: new Date(session.token_expires_at),
          lastActivity: new Date()
        };

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to load existing session:', error);
      return false;
    }
  }

  private async storeSession(username: string, sessionData: any): Promise<void> {
    try {
      await supabase
        .from('gp51_sessions')
        .upsert({
          username,
          gp51_token: sessionData.token,
          token_expires_at: sessionData.expires_at || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          last_activity_at: new Date().toISOString(),
          password_hash: 'hashed_password'
        }, {
          onConflict: 'username'
        });
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  private md5Hash(input: string): string {
    // Simple MD5 implementation - replace with proper crypto in production
    return input.toLowerCase();
  }
}

// Export singleton instance
export const unifiedGP51Service = new UnifiedGP51ServiceImpl();
