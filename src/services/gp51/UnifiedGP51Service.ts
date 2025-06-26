
import { productionGP51Service, ProductionGP51Service } from './ProductionGP51Service';
import { gp51CoreService } from '../GP51CoreService';

export interface UnifiedGP51Response<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// Export type definitions that were missing
export interface GP51User {
  username: string;
  usertype: number;
  showname: string;
  companyname?: string;
  email?: string;
  phone?: string;
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  status: string;
  lastactivetime: number;
  simnum?: string;
}

export interface GP51Session {
  username: string;
  token: string;
  isConnected: boolean;
  expiresAt: Date;
  lastActivity: Date;
}

export interface GP51AuthResponse {
  status: number;
  cause: string;
  token?: string;
  expires_at?: string;
}

export interface GP51MonitorListResponse {
  status: number;
  cause: string;
  groups: Array<{
    groupid: number;
    groupname: string;
    devices: GP51Device[];
  }>;
}

export interface GP51HealthStatus {
  isConnected: boolean;
  lastPingTime: Date;
  responseTime: number;
  tokenValid: boolean;
  sessionValid: boolean;
  activeDevices: number;
  errors: string[];
  lastCheck: Date;
  errorMessage?: string;
}

export class UnifiedGP51Service {
  private useProductionService = true;
  private _session: GP51Session | null = null;
  private _isConnected = false;

  constructor() {
    // Initialize with production service by default
  }

  get session(): GP51Session | null {
    return this._session;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async authenticate(username: string, password: string): Promise<UnifiedGP51Response> {
    try {
      if (this.useProductionService) {
        const response = await productionGP51Service.authenticate(username, password);
        
        this._isConnected = response.status === 0;
        if (this._isConnected) {
          this._session = {
            username,
            token: response.token || '',
            isConnected: true,
            expiresAt: new Date(response.expires_at || Date.now() + 24 * 60 * 60 * 1000),
            lastActivity: new Date()
          };
        }
        
        return {
          success: response.status === 0,
          data: response,
          status: response.status,
          error: response.status !== 0 ? response.cause : undefined
        };
      } else {
        // Fallback to mock service
        const response = await gp51CoreService.authenticate(username, password);
        return {
          success: response.status === 0,
          data: response,
          status: response.status
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async authenticateAdmin(username: string, password: string): Promise<UnifiedGP51Response> {
    return this.authenticate(username, password);
  }

  async queryMonitorList(): Promise<UnifiedGP51Response> {
    try {
      if (this.useProductionService) {
        const devices = await productionGP51Service.fetchAllDevices();
        
        return {
          success: true,
          data: {
            status: 0,
            cause: 'OK',
            groups: [{
              groupid: 1,
              groupname: 'Default Group',
              devices: devices
            }]
          }
        };
      } else {
        // Fallback to mock service
        const response = await gp51CoreService.queryMonitorList();
        return {
          success: response.status === 0,
          data: response,
          status: response.status
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to query monitor list'
      };
    }
  }

  async getLastPositions(deviceIds?: string[]): Promise<UnifiedGP51Response> {
    try {
      if (this.useProductionService) {
        const positions = await productionGP51Service.getLastPositions(deviceIds);
        
        return {
          success: true,
          data: {
            status: 0,
            cause: 'OK',
            records: positions
          }
        };
      } else {
        // Mock implementation for development
        return {
          success: true,
          data: {
            status: 0,
            records: []
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get positions'
      };
    }
  }

  async registerUser(userData: any): Promise<UnifiedGP51Response> {
    try {
      if (this.useProductionService) {
        const response = await productionGP51Service.registerUser(userData);
        
        return {
          success: response.status === 0,
          data: response,
          status: response.status,
          error: response.status !== 0 ? response.cause : undefined
        };
      } else {
        // Mock success for development
        return {
          success: true,
          data: { status: 0, cause: 'OK' }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User registration failed'
      };
    }
  }

  async registerDevice(deviceData: any): Promise<UnifiedGP51Response> {
    try {
      if (this.useProductionService) {
        const response = await productionGP51Service.registerDevice(deviceData);
        
        return {
          success: response.status === 0,
          data: response,
          status: response.status,
          error: response.status !== 0 ? response.cause : undefined
        };
      } else {
        // Mock success for development
        return {
          success: true,
          data: { status: 0, cause: 'OK' }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Device registration failed'
      };
    }
  }

  async sendCommand(deviceid: string, command: string, params: any[]): Promise<UnifiedGP51Response> {
    try {
      if (this.useProductionService) {
        const response = await productionGP51Service.sendVehicleCommand(deviceid, command, params);
        
        return {
          success: response.status === 0,
          data: response,
          status: response.status,
          error: response.status !== 0 ? response.cause : undefined
        };
      } else {
        // Mock success for development
        return {
          success: true,
          data: { status: 0, cause: 'OK' }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command failed'
      };
    }
  }

  // Session management
  async loadExistingSession(username: string): Promise<boolean> {
    if (this.useProductionService) {
      return await productionGP51Service.loadExistingSession(username);
    }
    return false;
  }

  async logout(): Promise<void> {
    if (this.useProductionService) {
      await productionGP51Service.logout();
    }
    this._session = null;
    this._isConnected = false;
  }

  async disconnect(): Promise<void> {
    await this.logout();
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    return {
      isConnected: this._isConnected,
      lastPingTime: new Date(),
      responseTime: 150,
      tokenValid: this._session !== null,
      sessionValid: this._session !== null,
      activeDevices: 0,
      errors: [],
      lastCheck: new Date()
    };
  }

  get isAuthenticated(): boolean {
    if (this.useProductionService) {
      return productionGP51Service.isAuthenticated;
    }
    return gp51CoreService.isConnected;
  }

  get currentUser(): string | null {
    if (this.useProductionService) {
      return productionGP51Service.currentUsername;
    }
    return gp51CoreService.session?.username || null;
  }

  // Development/testing methods
  enableProductionMode(): void {
    this.useProductionService = true;
  }

  enableDevelopmentMode(): void {
    this.useProductionService = false;
  }

  get isProductionMode(): boolean {
    return this.useProductionService;
  }
}

export const unifiedGP51Service = new UnifiedGP51Service();
