
import { productionGP51Service } from './ProductionGP51Service';

// Define types locally to avoid circular imports
export interface GP51User {
  id: string;
  username: string;
  email?: string;
  showname?: string;
  companyname?: string;
  phone?: string;
  usertype?: number;
  creater?: string;
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype?: number;
  status?: string;
  lastactivetime?: string;
  simnum?: string;
  owner_username?: string;
}

export interface GP51Session {
  id: string;
  username: string;
  token: string;
  expiresAt: Date;
  isActive: boolean;
  apiUrl?: string;
}

export interface GP51HealthStatus {
  status: 'healthy' | 'disconnected' | 'error' | 'degraded';
  lastCheck: Date;
  isAuthenticated: boolean;
  username?: string | null;
  connectionDetails: {
    apiUrl: string;
    lastSuccessfulAuth?: Date | null;
    errorCount: number;
  };
}

export interface UnifiedGP51Response<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class UnifiedGP51Service {
  private static instance: UnifiedGP51Service;
  private currentSession: GP51Session | null = null;

  private constructor() {}

  static getInstance(): UnifiedGP51Service {
    if (!UnifiedGP51Service.instance) {
      UnifiedGP51Service.instance = new UnifiedGP51Service();
    }
    return UnifiedGP51Service.instance;
  }

  // Session management
  get session(): GP51Session | null {
    return this.currentSession;
  }

  get isConnected(): boolean {
    return this.currentSession !== null && this.currentSession.isActive;
  }

  // Authentication wrapper
  async authenticate(username: string, password: string): Promise<UnifiedGP51Response<{ token: string; username: string }>> {
    try {
      const result = await productionGP51Service.authenticate(username, password);
      
      if (result.status === 0) {
        // Create session object
        this.currentSession = {
          id: `session_${Date.now()}`,
          username: username,
          token: result.token!,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          isActive: true,
          apiUrl: 'https://www.gps51.com/webapi'
        };

        return {
          success: true,
          data: {
            token: result.token!,
            username: username
          }
        };
      } else {
        return {
          success: false,
          error: result.cause || 'Authentication failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error'
      };
    }
  }

  // Admin authentication
  async authenticateAdmin(username: string, password: string): Promise<UnifiedGP51Response<{ token: string; username: string }>> {
    return this.authenticate(username, password);
  }

  // Monitor list wrapper
  async queryMonitorList(): Promise<UnifiedGP51Response<{ users: GP51User[]; devices: GP51Device[] }>> {
    try {
      const users = await productionGP51Service.fetchAllUsers();
      const devices = await productionGP51Service.fetchAllDevices();
      
      return {
        success: true,
        data: {
          users,
          devices
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch monitor list'
      };
    }
  }

  // Position updates wrapper
  async getLastPositions(deviceIds?: string[]): Promise<UnifiedGP51Response<{ records: any[] }>> {
    try {
      const positions = await productionGP51Service.getLastPositions(deviceIds);
      
      return {
        success: true,
        data: {
          records: positions
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch positions'
      };
    }
  }

  // Vehicle command wrapper
  async sendVehicleCommand(deviceId: string, command: string, parameters: any[] = []): Promise<UnifiedGP51Response<any>> {
    try {
      const result = await productionGP51Service.sendVehicleCommand(deviceId, command, parameters);
      
      if (result.status === 0) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.cause || 'Command execution failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command error'
      };
    }
  }

  // Send command wrapper
  async sendCommand(deviceId: string, command: string, parameters: any[] = []): Promise<UnifiedGP51Response<any>> {
    return this.sendVehicleCommand(deviceId, command, parameters);
  }

  // Session management
  async loadExistingSession(username: string): Promise<boolean> {
    return await productionGP51Service.loadExistingSession(username);
  }

  async logout(): Promise<void> {
    await productionGP51Service.logout();
    this.currentSession = null;
  }

  async disconnect(): Promise<void> {
    await this.logout();
  }

  // Status checks
  get isAuthenticated(): boolean {
    return productionGP51Service.isAuthenticated;
  }

  get currentUsername(): string | null {
    return productionGP51Service.currentUsername;
  }

  // Health check
  async getHealthStatus(): Promise<GP51HealthStatus> {
    return {
      status: this.isAuthenticated ? 'healthy' : 'disconnected',
      lastCheck: new Date(),
      isAuthenticated: this.isAuthenticated,
      username: this.currentUsername,
      connectionDetails: {
        apiUrl: 'https://www.gps51.com/webapi',
        lastSuccessfulAuth: null,
        errorCount: 0
      }
    };
  }

  async getConnectionHealth(): Promise<GP51HealthStatus> {
    return this.getHealthStatus();
  }

  // User registration wrapper
  async registerUser(userData: {
    username: string;
    password: string;
    email?: string;
    companyname?: string;
    cardname?: string;
    phone?: string;
  }): Promise<UnifiedGP51Response<any>> {
    try {
      const result = await productionGP51Service.registerUser(userData);
      
      if (result.status === 0) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.cause || 'User registration failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration error'
      };
    }
  }

  // Device registration wrapper
  async registerDevice(deviceData: {
    deviceid: string;
    devicename: string;
    devicetype: number;
    creater: string;
  }): Promise<UnifiedGP51Response<any>> {
    try {
      const result = await productionGP51Service.registerDevice(deviceData);
      
      if (result.status === 0) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.cause || 'Device registration failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Device registration error'
      };
    }
  }
}

export const unifiedGP51Service = UnifiedGP51Service.getInstance();
