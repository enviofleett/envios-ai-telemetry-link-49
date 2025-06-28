
import type { GP51FleetData, GP51Device, GP51Position, GP51Group, GP51AuthResponse, GP51FleetDataResponse } from '@/types/gp51-unified';

export class GP51EnhancedDataService {
  private token: string | null = null;
  private updateInterval?: NodeJS.Timeout;
  private subscribers: Array<(data: GP51FleetData) => void> = [];

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      // Simulate authentication
      if (username && password) {
        this.token = 'mock-token';
        return {
          status: 0,
          cause: 'Success',
          success: true,
          token: this.token,
          username
        };
      } else {
        return {
          status: 1,
          cause: 'Invalid credentials',
          success: false,
          error: 'Invalid credentials'
        };
      }
    } catch (error) {
      return {
        status: 1,
        cause: 'Authentication failed',
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async getCompleteFleetData(options?: any): Promise<GP51FleetDataResponse> {
    const mockDevices: GP51Device[] = [];
    const mockPositions: GP51Position[] = [];
    const mockGroups: GP51Group[] = [];

    const fleetData: GP51FleetData = {
      devices: mockDevices,
      positions: mockPositions,
      groups: mockGroups,
      summary: {
        totalDevices: mockDevices.length,
        activeDevices: mockDevices.filter(d => d.isActive).length,
        totalGroups: mockGroups.length
      },
      lastUpdate: new Date(),
      metadata: {
        requestId: Math.random().toString(36).substring(7),
        responseTime: 150,
        dataVersion: "1.0",
        source: "GP51Enhanced",
        fetchTime: new Date()
      }
    };

    return {
      success: true,
      data: fleetData
    };
  }

  startRealTimeUpdates(interval: number = 30000): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateInterval = setInterval(async () => {
      try {
        const fleetData = await this.getCompleteFleetData();
        if (fleetData.success && fleetData.data) {
          this.notifySubscribers(fleetData.data);
        }
      } catch (error) {
        console.error('Real-time update error:', error);
      }
    }, interval);
  }

  stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (event === 'position_update' || event === 'alerts') {
      this.subscribers.push(callback);
      
      return () => {
        const index = this.subscribers.indexOf(callback);
        if (index > -1) {
          this.subscribers.splice(index, 1);
        }
      };
    }
    
    return () => {};
  }

  private notifySubscribers(data: GP51FleetData): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  async generateFleetReport(options?: any): Promise<any> {
    const fleetData = await this.getCompleteFleetData();
    
    return {
      success: true,
      reportId: `report_${Date.now()}`,
      generatedAt: new Date().toISOString(),
      totalVehicles: fleetData.data?.devices.length || 0,
      data: fleetData.data?.devices || []
    };
  }

  async getVehicleHistory(deviceId: string, startDate: Date, endDate: Date): Promise<{ success: boolean; data?: GP51Position[]; error?: string }> {
    try {
      // Mock vehicle history data
      const mockHistory: GP51Position[] = [];
      
      return {
        success: true,
        data: mockHistory
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch vehicle history'
      };
    }
  }

  async getGeofences(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // Mock geofences data
      const mockGeofences: any[] = [];
      
      return {
        success: true,
        data: mockGeofences
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch geofences'
      };
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    this.stopRealTimeUpdates();
    this.subscribers = [];
  }
}

export const gp51EnhancedDataService = new GP51EnhancedDataService();
