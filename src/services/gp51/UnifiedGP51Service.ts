
import { productionGP51Service, ProductionGP51Service } from './ProductionGP51Service';
import { gp51CoreService } from '../GP51CoreService';

export interface UnifiedGP51Response<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export class UnifiedGP51Service {
  private useProductionService = true; // Flag to switch between production/mock

  constructor() {
    // Initialize with production service by default
  }

  async authenticate(username: string, password: string): Promise<UnifiedGP51Response> {
    try {
      if (this.useProductionService) {
        const response = await productionGP51Service.authenticate(username, password);
        
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
