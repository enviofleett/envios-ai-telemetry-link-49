
import type { 
  GP51HealthStatus, 
  GP51FleetDataResponse, 
  GP51Position, 
  GP51Device, 
  GP51Group,
  GP51PerformanceMetrics,
  GP51DataService as IGP51DataService 
} from '@/types/gp51-unified';
import { 
  createDefaultHealthStatus, 
  safeDateToString, 
  createDefaultPerformanceMetrics,
  GP51PropertyMapper 
} from '@/types/gp51-unified';

export class GP51DataService implements IGP51DataService {
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
      const startTime = Date.now();
      const testResult = await this.testConnection();
      const responseTime = Date.now() - startTime;
      
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
        errorMessage: testResult.error,
        responseTime: responseTime
      };
    } catch (error) {
      const healthStatus = createDefaultHealthStatus();
      return {
        ...healthStatus,
        error: error instanceof Error ? error.message : 'Unknown error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: safeDateToString(new Date()),
        lastPingTime: safeDateToString(new Date()),
        responseTime: 0
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

  async queryMonitorList(): Promise<{ success: boolean; data?: GP51Device[]; groups?: GP51Group[]; error?: string; }> {
    try {
      const response = await this.makeRequest('querymonitorlist', {});
      
      if (response.status !== 0) {
        return {
          success: false,
          error: response.cause || 'Failed to query monitor list'
        };
      }

      const devices: GP51Device[] = [];
      const groups: GP51Group[] = [];

      if (response.groups && Array.isArray(response.groups)) {
        response.groups.forEach((group: any) => {
          groups.push(GP51PropertyMapper.mapGroup(group));

          if (group.devices && Array.isArray(group.devices)) {
            group.devices.forEach((device: any) => {
              devices.push(GP51PropertyMapper.mapDevice(device));
            });
          }
        });
      }

      return {
        success: true,
        data: devices,
        groups: groups
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    const metrics = createDefaultPerformanceMetrics();
    
    try {
      const startTime = Date.now();
      const result = await this.testConnection();
      const responseTime = Date.now() - startTime;
      
      metrics.averageResponseTime = responseTime;
      metrics.connectionStability = result.success ? 100 : 0;
      metrics.successRate = result.success ? 100 : 0;
      metrics.errorRate = result.success ? 0 : 100;
      
      const devicesResult = await this.queryMonitorList();
      if (devicesResult.success && devicesResult.data) {
        metrics.totalVehicles = devicesResult.data.length;
        metrics.activeVehicles = devicesResult.data.filter(d => d.isActive).length;
        metrics.activeDevices = devicesResult.data.filter(d => d.isOnline).length;
        metrics.deviceCount = devicesResult.data.length;
      }
      
    } catch (error) {
      metrics.errorRate = 100;
      metrics.connectionStability = 0;
    }
    
    return metrics;
  }

  clearCache(): void {
    console.log('Cache cleared');
  }

  async getDevices(): Promise<GP51FleetDataResponse> {
    const result = await this.queryMonitorList();
    return {
      success: result.success,
      data: result.data,
      groups: result.groups,
      error: result.error,
      metadata: {
        timestamp: new Date().toISOString(),
        totalCount: result.data?.length || 0,
        filteredCount: result.data?.length || 0
      }
    };
  }

  async getLiveVehicles(): Promise<GP51FleetDataResponse> {
    return this.getDevices();
  }

  async getLastPosition(deviceId: string): Promise<GP51Position | null> {
    const positions = await this.getMultipleDevicesLastPositions([deviceId]);
    return positions.length > 0 ? positions[0] : null;
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<GP51Position[]> {
    try {
      const response = await this.makeRequest('lastposition', {
        deviceids: deviceIds,
        lastquerypositiontime: 0
      });

      if (response.status !== 0) {
        throw new Error(response.cause || 'Failed to fetch positions');
      }

      const positions: GP51Position[] = [];
      if (response.records && Array.isArray(response.records)) {
        response.records.forEach((record: any) => {
          positions.push(GP51PropertyMapper.mapPosition(record));
        });
      }

      return positions;
    } catch (error) {
      console.error('Error fetching multiple device positions:', error);
      return [];
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    if (deviceIds) {
      return this.getMultipleDevicesLastPositions(deviceIds);
    }
    return [];
  }

  async getHistoryTracks(deviceId: string, startTime: string, endTime: string): Promise<GP51Position[]> {
    try {
      const response = await this.makeRequest('querytracks', {
        deviceid: deviceId,
        begintime: startTime,
        endtime: endTime,
        timezone: 8
      });

      if (response.status !== 0) {
        throw new Error(response.cause || 'Failed to fetch history tracks');
      }

      const positions: GP51Position[] = [];
      if (response.records && Array.isArray(response.records)) {
        response.records.forEach((record: any) => {
          positions.push(GP51PropertyMapper.mapPosition(record));
        });
      }

      return positions;
    } catch (error) {
      console.error('Error fetching history tracks:', error);
      return [];
    }
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

  private async makeRequest(action: string, params: any): Promise<any> {
    const url = `${this.baseUrl}/webapi?action=${action}${this.token ? `&token=${this.token}` : ''}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

export const gp51DataService = new GP51DataService();
