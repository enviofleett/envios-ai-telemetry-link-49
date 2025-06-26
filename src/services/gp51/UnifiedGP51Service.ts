
import { GP51AuthResponse, GP51DeviceData, GP51HealthStatus } from '@/types/gp51-unified';

class UnifiedGP51Service {
  private _isAuthenticated: boolean = false;
  private _session: any = null;
  private _lastError: string | null = null;
  private _connectionHealth: 'healthy' | 'degraded' | 'failed' = 'failed';

  get isAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  get session(): any {
    return this._session;
  }

  get lastError(): string | null {
    return this._lastError;
  }

  get connectionHealth(): string {
    return this._connectionHealth;
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      console.log('🔐 UnifiedGP51Service: Starting authentication for:', username);
      this._lastError = null;
      
      // Try multiple authentication methods
      const authMethods = [
        () => this.authenticateViaHybrid(username, password),
        () => this.authenticateViaSecure(username, password),
        () => this.authenticateViaSettings(username, password)
      ];

      let lastError = null;
      
      for (const authMethod of authMethods) {
        try {
          const result = await authMethod();
          if (result.success) {
            this._isAuthenticated = true;
            this._connectionHealth = 'healthy';
            this._session = { username, authenticated: true };
            console.log('✅ Authentication successful via method');
            return result;
          } else {
            lastError = result.error || result.cause;
          }
        } catch (error) {
          console.warn('Auth method failed, trying next...', error);
          lastError = error instanceof Error ? error.message : 'Authentication method failed';
        }
      }

      // All methods failed
      const finalError = lastError || 'All authentication methods failed';
      this._lastError = finalError;
      this._connectionHealth = 'failed';
      
      console.error('❌ All authentication methods failed:', finalError);
      
      return {
        success: false,
        status: 'error',
        error: finalError,
        cause: finalError
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      this._lastError = errorMessage;
      this._connectionHealth = 'failed';
      
      console.error('❌ Authentication error:', error);
      
      return {
        success: false,
        status: 'error',
        error: errorMessage,
        cause: errorMessage
      };
    }
  }

  private async authenticateViaHybrid(username: string, password: string): Promise<GP51AuthResponse> {
    console.log('🔐 Trying hybrid authentication...');
    
    const response = await fetch('/api/gp51-hybrid-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(`Hybrid auth failed (${response.status}): ${errorData.error || errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      success: true,
      status: 'authenticated',
      token: data.token,
      expiresAt: data.expiresAt
    };
  }

  private async authenticateViaSecure(username: string, password: string): Promise<GP51AuthResponse> {
    console.log('🔐 Trying secure authentication...');
    
    const response = await fetch('/api/gp51-secure-auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'authenticate',
        username, 
        password 
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(`Secure auth failed (${response.status}): ${errorData.error || errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Secure authentication failed');
    }

    return {
      success: true,
      status: 'authenticated',
      token: data.token,
      expiresAt: data.expiresAt
    };
  }

  private async authenticateViaSettings(username: string, password: string): Promise<GP51AuthResponse> {
    console.log('🔐 Trying settings management authentication...');
    
    const response = await fetch('/api/settings-management', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token') || ''}`
      },
      body: JSON.stringify({ 
        action: 'authenticate-gp51',
        username, 
        password 
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(`Settings auth failed (${response.status}): ${errorData.error || errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Settings authentication failed');
    }

    return {
      success: true,
      status: 'authenticated',
      username: data.username,
      apiUrl: data.apiUrl
    };
  }

  async connect(): Promise<boolean> {
    try {
      // Basic connection check
      this._connectionHealth = 'healthy';
      return true;
    } catch (error) {
      this._connectionHealth = 'failed';
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this._isAuthenticated = false;
    this._session = null;
    this._connectionHealth = 'failed';
    console.log('🔌 Disconnected from GP51');
  }

  async logout(): Promise<void> {
    await this.disconnect();
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    try {
      // Perform a simple health check
      const healthCheck = await fetch('/api/gp51-connection-check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (healthCheck.ok) {
        this._connectionHealth = 'healthy';
        return {
          status: 'healthy',
          message: 'GP51 connection is healthy',
          timestamp: new Date().toISOString()
        };
      } else {
        this._connectionHealth = 'degraded';
        return {
          status: 'degraded',
          message: 'GP51 connection is degraded',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      this._connectionHealth = 'failed';
      return {
        status: 'failed',
        message: 'GP51 connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getDevices(deviceIds?: string[]): Promise<{ success: boolean; data?: GP51DeviceData[]; error?: string }> {
    try {
      if (!this._isAuthenticated) {
        return { success: false, error: 'Not authenticated' };
      }

      // Mock implementation - replace with actual API call
      return {
        success: true,
        data: []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch devices'
      };
    }
  }

  async getPositions(deviceIds?: string[]): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!this._isAuthenticated) {
        return { success: false, error: 'Not authenticated' };
      }

      // Mock implementation - replace with actual API call
      return {
        success: true,
        data: []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch positions'
      };
    }
  }

  clearError(): void {
    this._lastError = null;
  }
}

export const unifiedGP51Service = new UnifiedGP51Service();
