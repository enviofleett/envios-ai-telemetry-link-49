
import { supabase } from '@/integrations/supabase/client';

interface AuthResponse {
  success: boolean;
  sessionId?: string;
  vehicles?: Array<{
    deviceid: string;
    devicename: string;
    status: string;
  }>;
  error?: string;
  details?: any;
}

interface PositionResponse {
  success: boolean;
  positions?: Array<{
    deviceid: string;
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  }>;
  error?: string;
}

interface SettingsResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface StatusResponse {
  connected: boolean;
  username?: string;
  expiresAt?: string;
  error?: string;
}

interface ConnectionTestResponse {
  success: boolean;
  apiUrl?: string;
  error?: string;
  timestamp?: string;
}

export class TelemetryApi {
  private sessionId: string | null = null;

  async testConnection(): Promise<ConnectionTestResponse> {
    try {
      console.log('Testing GP51 connection via edge function...');
      
      const { data, error } = await supabase.functions.invoke('telemetry-auth', {
        body: { testConnection: true }
      });

      if (error) {
        console.error('Connection test edge function error:', error);
        throw new Error(error.message);
      }

      console.log('Connection test result:', data);
      return data;
    } catch (error) {
      console.error('Connection test request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  async authenticate(username: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Calling telemetry-auth function...');
      
      const { data, error } = await supabase.functions.invoke('telemetry-auth', {
        body: { username, password }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }

      if (data.error) {
        console.error('Authentication error:', data.error);
        return { 
          success: false, 
          error: data.error,
          details: data.details 
        };
      }

      this.sessionId = data.sessionId || data.token;
      console.log('Authentication successful, session ID:', this.sessionId);

      return {
        success: true,
        sessionId: data.sessionId || data.token,
        vehicles: data.vehicles || []
      };
    } catch (error) {
      console.error('Authentication request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  async getVehiclePositions(deviceIds?: string[]): Promise<PositionResponse> {
    if (!this.sessionId) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      console.log('Calling telemetry-positions function...');
      
      const { data, error } = await supabase.functions.invoke('telemetry-positions', {
        body: { sessionId: this.sessionId, deviceIds }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }

      if (data.error) {
        console.error('Position fetch error:', data.error);
        return { success: false, error: data.error };
      }

      console.log('Positions fetched successfully');
      return {
        success: true,
        positions: data.positions
      };
    } catch (error) {
      console.error('Position fetch request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch positions' 
      };
    }
  }

  async saveGP51Credentials(username: string, password: string): Promise<SettingsResponse> {
    try {
      console.log('Saving GP51 credentials...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'save-gp51-credentials', username, password }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }

      if (data.error) {
        console.error('Settings error:', data.error);
        return { success: false, error: data.error };
      }

      console.log('GP51 credentials saved successfully');
      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Save credentials request failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save credentials' 
      };
    }
  }

  async getGP51Status(): Promise<StatusResponse> {
    try {
      console.log('Checking GP51 connection status...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message);
      }

      console.log('GP51 status retrieved successfully');
      return {
        connected: data.connected,
        username: data.username,
        expiresAt: data.expiresAt,
        error: data.error
      };
    } catch (error) {
      console.error('Status check request failed:', error);
      return { 
        connected: false,
        error: error instanceof Error ? error.message : 'Failed to check status' 
      };
    }
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  clearSession(): void {
    this.sessionId = null;
  }

  // Helper method to check if the service is available
  async isServiceAvailable(): Promise<boolean> {
    const testResult = await this.testConnection();
    return testResult.success;
  }

  // Method to get service diagnostics
  async getDiagnostics(): Promise<{ 
    connectionTest: ConnectionTestResponse; 
    authTest?: AuthResponse;
    timestamp: string;
  }> {
    const connectionTest = await this.testConnection();
    
    return {
      connectionTest,
      timestamp: new Date().toISOString()
    };
  }
}

export const telemetryApi = new TelemetryApi();
