
import type { GP51HealthStatus, GP51FleetDataResponse, GP51Position } from '@/types/gp51-unified';
import { createDefaultHealthStatus, safeDateToString } from '@/types/gp51-unified';

export class GP51DataService {
  private token: string | null = null;
  private baseUrl: string = 'https://api.gps51.com';

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string): void {
    this.token = token;
  }

  async getHealthStatus(): Promise<GP51HealthStatus> {
    try {
      const testResult = await this.testConnection();
      const healthStatus = createDefaultHealthStatus();
      
      return {
        ...healthStatus,
        status: testResult.success ? 'connected' : 'disconnected',
        isConnected: testResult.success,
        success: testResult.success,
        error: testResult.error,
        lastCheck: safeDateToString(new Date()),
        lastPingTime: safeDateToString(new Date()),
        tokenValid: Boolean(this.token),
        sessionValid: Boolean(this.token),
        activeDevices: 0,
        errorMessage: testResult.error
      };
    } catch (error) {
      const healthStatus = createDefaultHealthStatus();
      return {
        ...healthStatus,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: safeDateToString(new Date()),
        lastPingTime: safeDateToString(new Date())
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${this.baseUrl}/webapi?action=querymonitorlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  async getDevices(): Promise<GP51FleetDataResponse> {
    return { success: true, data: [] };
  }

  async getLiveVehicles(): Promise<GP51FleetDataResponse> {
    return this.getDevices();
  }

  async getLastPosition(deviceId: string): Promise<GP51Position | null> {
    return null;
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<GP51Position[]> {
    return [];
  }

  async getHistoryTracks(deviceId: string, startTime?: Date, endTime?: Date): Promise<GP51Position[]> {
    return [];
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    if (deviceIds) {
      return this.getMultipleDevicesLastPositions(deviceIds);
    }
    return [];
  }

  async sendCommand(deviceId: string, command: string, params?: any[]): Promise<any> {
    return { success: true };
  }

  async login(username: string, password: string, type?: string): Promise<{ success: boolean; token?: string; error?: string }> {
    return { success: true, token: 'dummy-token' };
  }

  async logout(): Promise<void> {
    this.token = null;
  }
}

export const gp51DataService = new GP51DataService();
