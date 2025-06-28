
import { GP51TypeMapper } from './GP51TypeMapper';
import { buildGP51ApiUrl, GP51_ACTIONS } from './urlHelpers';
import type { GP51Device, GP51Position, GP51Group, GP51HealthStatus } from '@/types/gp51-unified';

export class GP51DataService {
  private token: string | null = null;
  private deviceCache: Map<string, GP51Device> = new Map();
  private positionCache: Map<string, GP51Position> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 30000; // 30 seconds

  setToken(token: string): void {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearCache(): void {
    this.deviceCache.clear();
    this.positionCache.clear();
    this.cacheTimestamp = 0;
  }

  async getHealthStatus(): Promise<GP51HealthStatus> {
    try {
      const testResult = await this.testConnection();
      return {
        status: testResult.success ? 'connected' : 'disconnected',
        isHealthy: testResult.success,
        connectionStatus: testResult.success ? 'connected' : 'disconnected',
        isConnected: testResult.success,
        lastPingTime: new Date(),
        responseTime: 150,
        tokenValid: Boolean(this.token),
        sessionValid: Boolean(this.token),
        activeDevices: 0,
        errorMessage: testResult.error,
        lastCheck: new Date(),
        connectionQuality: testResult.success ? 'excellent' : 'poor',
        errorCount: testResult.success ? 0 : 1,
        lastError: testResult.error,
        md5TestPassed: true,
        success: testResult.success,
        error: testResult.error
      };
    } catch (error) {
      return {
        status: 'error',
        isHealthy: false,
        connectionStatus: 'error',
        isConnected: false,
        lastPingTime: new Date(),
        responseTime: 0,
        tokenValid: false,
        sessionValid: false,
        activeDevices: 0,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date(),
        connectionQuality: 'poor',
        errorCount: 1,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        md5TestPassed: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getLiveVehicles(): Promise<{
    success: boolean;
    data?: GP51Device[];
    groups?: GP51Group[];
    error?: string;
  }> {
    return this.queryMonitorList();
  }

  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51Device[];
    groups?: GP51Group[];
    error?: string;
  }> {
    try {
      if (!this.token) {
        return {
          success: false,
          error: 'No authentication token available'
        };
      }

      const url = buildGP51ApiUrl(GP51_ACTIONS.DEVICE_TREE, this.token);
      const response = await this.makeApiCall(url, {});

      if (response.status !== 0) {
        return {
          success: false,
          error: response.cause || 'Failed to fetch monitor list'
        };
      }

      const devices: GP51Device[] = [];
      const groups: GP51Group[] = [];

      if (response.groups && Array.isArray(response.groups)) {
        response.groups.forEach((group: any) => {
          const mappedGroup = GP51TypeMapper.mapApiGroupToUnified({
            ...group,
            parentgroupid: group.parentgroupid || ''
          });
          groups.push(mappedGroup);

          if (group.devices && Array.isArray(group.devices)) {
            group.devices.forEach((device: any) => {
              const mappedDevice = GP51TypeMapper.mapApiDeviceToUnified({
                ...device,
                groupname: group.groupname || ''
              });
              devices.push(mappedDevice);
            });
          }
        });
      }

      // Update cache
      devices.forEach(device => {
        this.deviceCache.set(device.deviceid, device);
      });
      this.cacheTimestamp = Date.now();

      return {
        success: true,
        data: devices,
        groups: groups
      };
    } catch (error) {
      console.error('💥 Monitor list query failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query monitor list'
      };
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      if (!this.token) {
        console.error('❌ No authentication token');
        return [];
      }

      const url = buildGP51ApiUrl(GP51_ACTIONS.POSITIONS, this.token);
      const response = await this.makeApiCall(url, {
        deviceids: deviceIds || [],
        lastquerypositiontime: 0
      });

      if (response.status !== 0) {
        console.error('❌ Position query failed:', response.cause);
        return [];
      }

      const positions: GP51Position[] = [];

      if (response.records && Array.isArray(response.records)) {
        response.records.forEach((record: any) => {
          const mappedPosition = GP51TypeMapper.mapApiPositionToUnified({
            ...record,
            servertime: record.servertime || new Date().toISOString(),
            battery: record.battery || record.voltagepercent || 0,
            signal: record.signal || record.rxlevel || 0,
            satellites: record.satellites || record.gpsvalidnum || 0
          });
          positions.push(mappedPosition);
          this.positionCache.set(mappedPosition.deviceid, mappedPosition);
        });
      }

      return positions;
    } catch (error) {
      console.error('💥 Position fetch error:', error);
      return [];
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    return this.getPositions(deviceIds);
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<GP51Position[]> {
    return this.getPositions(deviceIds);
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.token) {
        return {
          success: false,
          error: 'No authentication token'
        };
      }

      const url = buildGP51ApiUrl(GP51_ACTIONS.DEVICE_TREE, this.token);
      const response = await this.makeApiCall(url, {});

      return {
        success: response.status === 0,
        error: response.status !== 0 ? response.cause || 'Connection test failed' : undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  private async makeApiCall(url: string, body: any): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }
}

export const gp51DataService = new GP51DataService();
