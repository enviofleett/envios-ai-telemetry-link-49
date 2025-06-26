
import { GP51AuthService } from './GP51AuthService';
import { GP51DataService } from './GP51DataService';
import { GP51HealthService } from './GP51HealthService';
import { GP51HealthStatus, GP51AuthResponse, GP51DeviceData, GP51Position, GP51Group } from '@/types/gp51-unified';

export class UnifiedGP51Service {
  private authService: GP51AuthService;
  private dataService: GP51DataService;
  private healthService: GP51HealthService;

  constructor() {
    this.authService = new GP51AuthService();
    this.dataService = new GP51DataService();
    this.healthService = new GP51HealthService();
  }

  // Auth methods
  get session() { return this.authService.session; }
  get isAuthenticated() { return this.authService.isAuthenticated; }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    return this.authService.authenticate(username, password);
  }

  async loadExistingSession(): Promise<boolean> {
    return this.authService.loadExistingSession();
  }

  async connect(): Promise<boolean> {
    return await this.authService.loadExistingSession();
  }

  async disconnect(): Promise<void> {
    return this.authService.disconnect();
  }

  async logout(): Promise<void> {
    return this.authService.logout();
  }

  // Data methods
  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51DeviceData[];
    groups?: GP51Group[];
    error?: string;
  }> {
    return this.dataService.queryMonitorList();
  }

  async getLastPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      const result = await this.dataService.getPositions();
      
      // Return just the data array, filter by deviceIds if provided
      if (Array.isArray(result)) {
        return deviceIds ? result.filter(pos => deviceIds.includes(pos.deviceId)) : result;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Position fetch error:', error);
      return [];
    }
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    try {
      const result = await this.dataService.getPositions();
      
      // Return just the data array, filter by deviceIds if provided
      if (Array.isArray(result)) {
        return deviceIds ? result.filter(pos => deviceIds.includes(pos.deviceId)) : result;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Position fetch error:', error);
      return [];
    }
  }

  async getDevices(deviceIds?: string[]) {
    return this.dataService.queryMonitorList();
  }

  // Health methods
  async getConnectionHealth(): Promise<GP51HealthStatus> {
    return this.healthService.getConnectionHealth();
  }
}

// Create and export singleton instance
export const unifiedGP51Service = new UnifiedGP51Service();
