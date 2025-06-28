
import { supabaseGP51AuthService } from './SupabaseGP51AuthService';
import { gp51DataService } from './GP51DataService';
import { GP51HealthService } from './GP51HealthService';
import { GP51HealthStatus, GP51AuthResponse, GP51Device, GP51Position, GP51Group } from '@/types/gp51-unified';

export class UnifiedGP51Service {
  private authService: typeof supabaseGP51AuthService;
  private dataService: typeof gp51DataService;
  private healthService: GP51HealthService;

  constructor() {
    this.authService = supabaseGP51AuthService;
    this.dataService = gp51DataService;
    this.healthService = new GP51HealthService();
  }

  // Auth methods
  get session() { 
    return this.authService.sessionInfo; 
  }
  
  get isAuthenticated() { 
    return this.authService.isAuthenticated; 
  }

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

  // Data methods - now using real API calls
  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51Device[];
    groups?: GP51Group[];
    error?: string;
  }> {
    try {
      if (!this.isAuthenticated) {
        return {
          success: false,
          error: 'Not authenticated with GP51'
        };
      }

      return await this.dataService.queryMonitorList();
    } catch (error) {
      console.error('💥 Query monitor list failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch devices'
      };
    }
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<GP51Position[]> {
    return this.dataService.getMultipleDevicesLastPositions(deviceIds);
  }

  async getLastPositions(deviceIds: string[]): Promise<GP51Position[]> {
    return this.getMultipleDevicesLastPositions(deviceIds);
  }

  async getPositions(deviceIds?: string[]): Promise<GP51Position[]> {
    if (deviceIds && deviceIds.length > 0) {
      return this.getMultipleDevicesLastPositions(deviceIds);
    }
    return [];
  }

  async getDevices(deviceIds?: string[]) {
    const result = await this.queryMonitorList();
    
    if (!result.success || !result.data) {
      return result;
    }

    // Filter devices if specific IDs requested
    if (deviceIds && deviceIds.length > 0) {
      const filteredDevices = result.data.filter(device => 
        deviceIds.includes(device.deviceid)
      );
      
      return {
        ...result,
        data: filteredDevices
      };
    }

    return result;
  }

  // Health methods
  async getConnectionHealth(): Promise<GP51HealthStatus> {
    return this.healthService.getConnectionHealth();
  }

  // Cache management
  clearCache(): void {
    this.dataService.clearCache();
  }

  // Connection test
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return this.dataService.testConnection();
  }
}

export const unifiedGP51Service = new UnifiedGP51Service();
