
import { supabase } from '@/integrations/supabase/client';
import type { GP51AuthResponse, GP51User, GP51Device, GP51HealthStatus, GP51ProcessedPosition, GP51Session } from '@/types/gp51';
import md5 from 'crypto-js/md5';

export interface GP51Config {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  defaultTimezone: number;
}

export class ProductionGP51Service {
  private config: GP51Config = {
    baseUrl: 'https://www.gps51.com/webapi',
    timeout: 30000,
    retryAttempts: 3,
    defaultTimezone: 8
  };

  private currentToken: string | null = null;
  private currentUsername: string | null = null;

  // Public getters for external access
  get username(): string | null {
    return this.currentUsername;
  }

  get isConnected(): boolean {
    return this.currentToken !== null && this.currentUsername !== null;
  }

  get session(): GP51Session | null {
    if (this.currentUsername && this.currentToken) {
      return {
        username: this.currentUsername,
        token: this.currentToken,
        isConnected: this.isConnected,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        lastActivity: new Date()
      };
    }
    return null;
  }

  async authenticate(username: string, password: string, userType: 'USER' | 'DEVICE' = 'USER'): Promise<GP51AuthResponse> {
    try {
      const hashedPassword = md5(password).toString();
      
      const response = await this.makeRequest('login', {
        username,
        password: hashedPassword,
        from: 'WEB',
        type: userType
      });

      if (response.status === 0) {
        this.currentToken = response.token;
        this.currentUsername = username;
        
        await this.storeSession(username, {
          token: response.token,
          expires_at: response.expires_at,
          login_time: new Date().toISOString(),
          user_type: userType,
          is_admin: username === 'octopus'
        });

        await this.logOperation('auth', username, { userType }, response);
      }

      return response;
    } catch (error) {
      await this.logOperation('auth', username, { userType }, null, error);
      throw error;
    }
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    try {
      const startTime = Date.now();
      const response = await this.queryMonitorList();
      const responseTime = Date.now() - startTime;
      
      const health: GP51HealthStatus = {
        isConnected: response.status === 0,
        lastPingTime: new Date(),
        responseTime,
        tokenValid: this.currentToken !== null,
        sessionValid: this.currentToken !== null && this.currentUsername !== null,
        activeDevices: response.groups?.flatMap(g => g.devices || []).length || 0,
        errors: response.status !== 0 ? [response.cause] : [],
        lastCheck: new Date(),
        errorMessage: response.status !== 0 ? response.cause : undefined
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
        errorMessage: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async disconnect(): Promise<void> {
    this.currentToken = null;
    this.currentUsername = null;
  }

  async sendCommand(deviceid: string, command: string, params: any[] = []): Promise<any> {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    return await this.makeRequest('sendcommand', {
      deviceid,
      command,
      params
    });
  }

  async fetchAllUsers(): Promise<GP51User[]> {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await this.makeRequest('querymonitorlist', {
        username: this.currentUsername
      });

      const users: GP51User[] = [];
      
      if (response.groups) {
        for (const group of response.groups) {
          if (group.devices) {
            for (const device of group.devices) {
              await this.storeDeviceData(device, group);
            }
          }
        }
      }

      await this.logOperation('fetch_users', this.currentUsername, {}, response);
      return users;
    } catch (error) {
      await this.logOperation('fetch_users', this.currentUsername, {}, null, error);
      throw error;
    }
  }

  async fetchAllDevices(): Promise<GP51Device[]> {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await this.queryMonitorList();
      
      const devices: GP51Device[] = [];
      if (response.groups) {
        for (const group of response.groups) {
          if (group.devices) {
            devices.push(...group.devices);
          }
        }
      }

      return devices;
    } catch (error) {
      throw new Error(`Failed to fetch devices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async queryMonitorList(username?: string): Promise<any> {
    if (!this.currentToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await this.makeRequest('querymonitorlist', {
        username: username || this.currentUsername
      });
      
      return response;
    } catch (error) {
      throw new Error(`Failed to query monitor list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async makeRequest(action: string, data: any): Promise<any> {
    const url = `${this.config.baseUrl}?action=${action}${this.currentToken ? `&token=${this.currentToken}` : ''}`;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Envio-Fleet-Management/1.0'
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return result;

      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw new Error(`GP51 API request failed after ${this.config.retryAttempts} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  private async storeSession(username: string, sessionData: any): Promise<void> {
    try {
      await supabase
        .from('gp51_sessions')
        .upsert({
          username,
          session_data: sessionData,
          token: sessionData.token,
          expires_at: sessionData.expires_at,
          is_admin: sessionData.is_admin || false
        });
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  private async storeDeviceData(device: any, group: any): Promise<void> {
    try {
      console.log('Storing device:', device.deviceid);
      // Implementation for storing device data
    } catch (error) {
      console.error('Failed to store device data:', error);
    }
  }

  private async logOperation(operation: string, username: string | null, requestData: any, responseData: any, error?: any): Promise<void> {
    try {
      await supabase
        .from('gp51_sync_log')
        .insert({
          operation_type: operation,
          username: username || 'unknown',
          request_data: requestData,
          response_data: responseData,
          status: error ? 'error' : 'success',
          gp51_status_code: responseData?.status || -1
        });
    } catch (logError) {
      console.error('Failed to log operation:', logError);
    }
  }
}

export const productionGP51Service = new ProductionGP51Service();
