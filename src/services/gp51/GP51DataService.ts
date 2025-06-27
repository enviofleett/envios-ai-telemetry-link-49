
import type { 
  GP51HealthStatus,
  GP51DeviceTreeResponse as GP51ServiceResponse,
  GP51Position,
  GP51PerformanceMetrics,
  GP51Device as GP51DeviceData
} from '@/types/gp51-unified';
import { GP51PropertyMapper } from '@/types/gp51-unified';

export class GP51DataService {
  private token: string | null = null;

  async getHealthStatus(): Promise<GP51HealthStatus> {
    return {
      status: 'healthy',
      lastCheck: new Date(),
      isConnected: true,
      lastPingTime: new Date(),
      tokenValid: true,
      sessionValid: true,
      activeDevices: 10,
      isHealthy: true,
      connectionStatus: 'connected'
    };
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    return {
      totalVehicles: 25,
      activeVehicles: 20,
      activeDevices: 20,
      lastUpdateTime: new Date(),
      averageResponseTime: 150,
      errorRate: 0.02,
      dataQuality: 0.95,
      onlinePercentage: 80,
      utilizationRate: 75
    };
  }

  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51DeviceData[];
    groups?: any[];
    error?: string;
  }> {
    // Mock implementation
    return {
      success: true,
      data: [],
      groups: []
    };
  }

  async getPositions(): Promise<GP51Position[]> {
    // Mock implementation
    return [];
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51Position>> {
    const positions = await this.getPositions();
    const devicePositions = new Map<string, GP51Position>();
    
    positions.forEach(pos => {
      if (deviceIds.includes(pos.deviceid)) {
        devicePositions.set(pos.deviceid, pos);
      }
    });
    
    return devicePositions;
  }

  async getLiveVehicles(): Promise<{
    success: boolean;
    data?: any[];
    groups?: any;
    error?: string;
  }> {
    return {
      success: true,
      data: [],
      groups: {}
    };
  }

  async testConnection(): Promise<GP51HealthStatus> {
    return this.getHealthStatus();
  }

  processPositions(positions: GP51Position[]): GP51Position[] {
    return positions.map(pos => {
      const enhanced = GP51PropertyMapper.enhancePosition(pos);
      // Use deviceid consistently
      console.log(`Processing position for device: ${enhanced.deviceid}`);
      return enhanced;
    });
  }
}

export const gp51DataService = new GP51DataService();
