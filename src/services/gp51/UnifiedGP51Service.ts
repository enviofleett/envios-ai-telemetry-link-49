
import { ProductionGP51Service } from './ProductionGP51Service';
import type { 
  GP51User, 
  GP51Device, 
  GP51Session, 
  GP51HealthStatus, 
  GP51AuthResponse,
  GP51MonitorListResponse
} from '@/types/gp51';

export interface UnifiedGP51Response<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface UnifiedGP51Service {
  session: GP51Session | null;
  isConnected: boolean;
  
  authenticate(username: string, password: string): Promise<GP51AuthResponse>;
  authenticateAdmin(username: string, password: string): Promise<GP51AuthResponse>;
  getConnectionHealth(): Promise<GP51HealthStatus>;
  disconnect(): Promise<void>;
  sendCommand(deviceid: string, command: string, params: any[]): Promise<any>;
  queryMonitorList(username?: string): Promise<GP51MonitorListResponse>;
  addUser(userData: any): Promise<GP51AuthResponse>;
  addDevice(deviceData: any): Promise<GP51AuthResponse>;
  logout(): Promise<void>;
}

export class UnifiedGP51ServiceImpl implements UnifiedGP51Service {
  private gp51Service = new ProductionGP51Service();

  get session(): GP51Session | null {
    return this.gp51Service.session;
  }

  get isConnected(): boolean {
    return this.gp51Service.isConnected;
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    return await this.gp51Service.authenticate(username, password);
  }

  async authenticateAdmin(username: string, password: string): Promise<GP51AuthResponse> {
    return await this.gp51Service.authenticate(username, password, 'USER');
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    return await this.gp51Service.getConnectionHealth();
  }

  async disconnect(): Promise<void> {
    return await this.gp51Service.disconnect();
  }

  async sendCommand(deviceid: string, command: string, params: any[]): Promise<any> {
    return await this.gp51Service.sendCommand(deviceid, command, params);
  }

  async queryMonitorList(username?: string): Promise<GP51MonitorListResponse> {
    try {
      const response = await this.gp51Service.fetchAllDevices();
      return { 
        status: 0, 
        cause: 'OK', 
        groups: [{
          groupid: 1,
          groupname: 'Default',
          devices: response
        }] 
      };
    } catch (error) {
      return { 
        status: -1, 
        cause: error instanceof Error ? error.message : 'Unknown error', 
        groups: [] 
      };
    }
  }

  async addUser(userData: any): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async addDevice(deviceData: any): Promise<GP51AuthResponse> {
    return { status: 0, cause: 'OK' };
  }

  async logout(): Promise<void> {
    await this.disconnect();
  }

  async testConnection(): Promise<UnifiedGP51Response> {
    try {
      const health = await this.getConnectionHealth();
      
      return {
        success: health.isConnected,
        data: {
          sessionValid: health.sessionValid,
          activeDevices: health.activeDevices,
          responseTime: health.responseTime
        },
        error: health.isConnected ? undefined : health.errorMessage,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date()
      };
    }
  }
}

export const unifiedGP51Service = new UnifiedGP51ServiceImpl();

// Re-export types for convenience
export type {
  GP51User,
  GP51Device,
  GP51Session,
  GP51HealthStatus,
  UnifiedGP51Response
};
