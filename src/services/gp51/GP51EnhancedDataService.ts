
import { 
  GP51Device, 
  GP51FleetData, 
  GP51AuthResponse,
  createDefaultFleetData
} from '@/types/gp51-unified';

export class GP51EnhancedDataService {
  private subscribers: Array<(data: GP51FleetData) => void> = [];

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
