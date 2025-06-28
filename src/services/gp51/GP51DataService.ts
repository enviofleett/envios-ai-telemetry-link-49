import axios from 'axios';
import MD5 from 'crypto-js/md5';
import { cache } from '@/cache';
import type { 
  GP51HealthStatus, 
  GP51PerformanceMetrics,
  GP51Device, 
  GP51Position, 
  GP51Group 
} from '@/types/gp51-unified';
import { createDefaultPerformanceMetrics, safeToString } from '@/types/gp51-unified';

export class GP51DataService {
  private baseURL: string;
  private apiKey: string;
  private apiSecret: string;
  private loginName: string;
  private loginPass: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.apiKey = process.env.GP51_API_KEY || '';
    this.apiSecret = process.env.GP51_API_SECRET || '';
    this.loginName = process.env.GP51_LOGIN_NAME || '';
    this.loginPass = process.env.GP51_LOGIN_PASS || '';
  }

  private async callAPI(method: string, params: any): Promise<any> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signSource = `${this.apiKey}${timestamp}${this.apiSecret}`;
    const sign = MD5(signSource).toString();

    const url = `${this.baseURL}/api/${method}`;
    const data = {
      apikey: this.apiKey,
      timestamp: timestamp,
      sign: sign,
      ...params,
    };

    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error: any) {
      console.error(`GP51 API error calling ${method}:`, error.message);
      throw error;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.callAPI('device/queryMonitorList', {
        loginname: this.loginName,
        loginpass: this.loginPass,
        pageindex: 1,
        pagesize: 1,
      });

      if (response && response.status === 0) {
        return { success: true };
      } else {
        return { success: false, error: response?.cause || 'Connection failed' };
      }
    } catch (error: any) {
      console.error('GP51 Connection Test Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getHealthStatus(): Promise<GP51HealthStatus> {
    try {
      const testResult = await this.testConnection();
      return {
        status: testResult.success ? 'connected' : 'disconnected', // Fixed: removed 'error' 
        lastCheck: new Date().toISOString(),
        isConnected: testResult.success,
        lastPingTime: new Date().toISOString(),
        connectionQuality: testResult.success ? 'excellent' : 'poor',
        errorCount: testResult.success ? 0 : 1,
        lastError: testResult.error,
        md5TestPassed: true,
        success: testResult.success,
        error: testResult.error
      };
    } catch (error) {
      return {
        status: 'disconnected', // Fixed: use valid union member
        lastCheck: new Date().toISOString(),
        isConnected: false,
        lastPingTime: new Date().toISOString(),
        connectionQuality: 'poor',
        errorCount: 1,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        md5TestPassed: false,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    try {
      const startTime = Date.now();
      const testResult = await this.testConnection();
      const responseTime = Date.now() - startTime;

      // Use the default metrics as base and override specific values
      const metrics = createDefaultPerformanceMetrics();
      return {
        ...metrics,
        responseTime,
        success: testResult.success,
        averageResponseTime: responseTime, // Now valid with updated interface
        timestamp: new Date().toISOString(),
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      return createDefaultPerformanceMetrics();
    }
  }

  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51Device[];
    groups?: GP51Group[];
    error?: string;
  }> {
    try {
      const cacheKey = 'queryMonitorList';
      const cachedData = cache.get(cacheKey);

      if (cachedData) {
        console.log('✅ Returning cached monitor list');
        return cachedData;
      }

      const response = await this.callAPI('device/queryMonitorList', {
        loginname: this.loginName,
        loginpass: this.loginPass,
        pageindex: 1,
        pagesize: 1000,
      });

      if (response && response.status === 0) {
        const result = {
          success: true,
          data: response.data,
          groups: response.groups,
        };
        cache.set(cacheKey, result, 300); // Cache for 5 minutes
        return result;
      } else {
        return { success: false, error: response?.cause || 'Failed to query monitor list' };
      }
    } catch (error: any) {
      console.error('💥 Query monitor list failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      if (!deviceIds || deviceIds.length === 0) {
        return [];
      }

      const response = await this.callAPI('device/getLastPosition', {
        loginname: this.loginName,
        loginpass: this.loginPass,
        deviceids: deviceIds.join(','),
      });

      if (response && response.status === 0) {
        return response.data || [];
      } else {
        console.warn('Failed to get positions:', response?.cause);
        return [];
      }
    } catch (error: any) {
      console.error('💥 Position fetch error:', error.message);
      return [];
    }
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<GP51Position[]> {
    try {
      if (!deviceIds || deviceIds.length === 0) {
        return [];
      }

      const response = await this.callAPI('device/getLastPosition', {
        loginname: this.loginName,
        loginpass: this.loginPass,
        deviceids: deviceIds.join(','),
      });

      if (response && response.status === 0) {
        return response.data || [];
      } else {
        console.warn('Failed to get positions:', response?.cause);
        return [];
      }
    } catch (error: any) {
      console.error('💥 Position fetch error:', error.message);
      return [];
    }
  }

  async getLiveVehicles(): Promise<any> {
    try {
      const response = await this.callAPI('device/queryMonitorList', {
        loginname: this.loginName,
        loginpass: this.loginPass,
        pageindex: 1,
        pagesize: 1000,
      });

      return response;
    } catch (error: any) {
      console.error('Error fetching live vehicles:', error);
      throw error;
    }
  }

  clearCache(): void {
    cache.flushAll();
  }

  private handleNeverType(value: never): string {
    return safeToString(value); // Use utility function
  }
}

export const gp51DataService = new GP51DataService(
  process.env.GP51_BASE_URL || 'http://localhost:8080'
);
