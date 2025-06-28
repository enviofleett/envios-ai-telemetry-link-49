
import { 
  GP51Device, 
  GP51FleetData, 
  GP51AuthResponse,
  GP51Position,
  GP51PerformanceMetrics,
  GP51FleetDataOptions,
  createDefaultFleetData,
  createDefaultPerformanceMetrics
} from '@/types/gp51-unified';

export class GP51EnhancedDataService {
  private subscribers: Array<(data: GP51FleetData) => void> = [];
  private updateInterval?: NodeJS.Timeout;
  private token: string | null = null;

  async login(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      return {
        success: true,
        token: 'dummy-token'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async getDevices(): Promise<GP51Device[]> {
    try {
      const fleetData = await this.getFleetData();
      return fleetData.devices;
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  }

  async getFleetData(): Promise<GP51FleetData> {
    try {
      const devices: GP51Device[] = [];
      
      const fleetData = createDefaultFleetData();
      fleetData.devices = devices;
      fleetData.summary.totalDevices = devices.length;
      fleetData.summary.onlineDevices = devices.filter(d => d.isfree === 1).length;
      
      this.notifySubscribers(fleetData);
      return fleetData;
    } catch (error) {
      console.error('Error fetching fleet data:', error);
      return createDefaultFleetData();
    }
  }

  // ADDED - Enhanced service methods
  startRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        const fleetData = await this.getCompleteFleetData();
        this.notifySubscribers(fleetData);
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    }, 30000);
  }

  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    return this.login(username, password);
  }

  async getCompleteFleetData(options?: GP51FleetDataOptions): Promise<GP51FleetData> {
    try {
      const fleetData = createDefaultFleetData();
      
      // Apply group filter if specified
      if (options?.groupFilter && options.groupFilter.length > 0) {
        fleetData.devices = fleetData.devices.filter(device => 
          options.groupFilter!.includes(device.groupname || '')
        );
      }
      
      return fleetData;
    } catch (error) {
      console.error('Error fetching complete fleet data:', error);
      return createDefaultFleetData();
    }
  }

  async generateFleetReport(): Promise<any> {
    const fleetData = await this.getCompleteFleetData();
    
    return {
      reportId: `report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      totalVehicles: fleetData.summary.totalDevices,
      activeVehicles: fleetData.summary.activeDevices,
      onlineVehicles: fleetData.summary.onlineDevices,
      data: fleetData.devices
    };
  }

  async getVehicleHistory(deviceId: string, timeRange: any): Promise<GP51Position[]> {
    return [];
  }

  async getGeofences(): Promise<any[]> {
    return [];
  }

  async logout(): Promise<void> {
    this.token = null;
    this.stopRealTimeUpdates();
  }

  private notifySubscribers(fleetData: GP51FleetData): void {
    this.subscribers.forEach(callback => {
      try {
        callback(fleetData);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  subscribe(callback: (data: GP51FleetData) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private getDevicesFromResult(result: GP51Device[] | GP51FleetData): GP51Device[] {
    if (Array.isArray(result)) {
      return result;
    }
    return result.devices || [];
  }
}

export const gp51EnhancedDataService = new GP51EnhancedDataService();
