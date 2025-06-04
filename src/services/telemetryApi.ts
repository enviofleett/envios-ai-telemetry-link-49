
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

export class TelemetryApi {
  private sessionId: string | null = null;

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
        return { success: false, error: data.error };
      }

      this.sessionId = data.sessionId;
      console.log('Authentication successful, session ID:', this.sessionId);

      return {
        success: true,
        sessionId: data.sessionId,
        vehicles: data.vehicles
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

  getSessionId(): string | null {
    return this.sessionId;
  }

  clearSession(): void {
    this.sessionId = null;
  }
}

export const telemetryApi = new TelemetryApi();
