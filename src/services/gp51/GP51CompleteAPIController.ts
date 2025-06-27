
import type { 
  GP51HealthStatus,
  GP51Device,
  GP51Position,
  GP51PerformanceMetrics,
  GP51Group,
  GP51FleetData,
  GP51FleetDataOptions,
  GP51LiveData
} from '@/types/gp51-unified';
import { GP51DataService } from './GP51DataService';

interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export class GP51CompleteAPIController {
  private dataService: GP51DataService;

  constructor() {
    this.dataService = new GP51DataService();
  }

  async getHealthStatus(): Promise<GP51HealthStatus> {
    return this.dataService.getHealthStatus();
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    return this.dataService.getPerformanceMetrics();
  }

  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51Device[];
    groups?: GP51Group[];
    error?: string;
  }> {
    return this.dataService.queryMonitorList();
  }

  async getPositions(): Promise<GP51Position[]> {
    return this.dataService.getPositions();
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51Position>> {
    return this.dataService.getMultipleDevicesLastPositions(deviceIds);
  }

  async getLiveVehicles(): Promise<{
    success: boolean;
    data?: any[];
    groups?: any;
    error?: string;
  }> {
    return this.dataService.getLiveVehicles();
  }

  async getCompleteFleetData(options?: GP51FleetDataOptions): Promise<{
    success: boolean;
    data?: GP51FleetData;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      const [devicesResult, positions] = await Promise.all([
        this.queryMonitorList(),
        this.getPositions()
      ]);

      if (!devicesResult.success) {
        return {
          success: false,
          error: devicesResult.error || 'Failed to fetch devices'
        };
      }

      // Fix: Convert number array to string array for groupFilter
      let filteredDevices = devicesResult.data || [];
      if (options?.groupFilter) {
        const groupFilterStrings = options.groupFilter.map(id => 
          typeof id === 'number' ? id.toString() : id
        );
        // Apply group filtering logic here if needed
      }

      const fleetData: GP51FleetData = {
        devices: filteredDevices,
        positions: positions,
        groups: devicesResult.groups || [],
        summary: {
          totalDevices: filteredDevices.length,
          activeDevices: filteredDevices.filter(d => d.isActive).length,
          totalGroups: (devicesResult.groups || []).length
        },
        lastUpdate: new Date(),
        metadata: {
          requestId: Math.random().toString(36).substring(7),
          responseTime: Date.now() - startTime,
          dataVersion: "1.0",
          source: "GP51API",
          options,
          fetchTime: new Date()
        }
      };

      return {
        success: true,
        data: fleetData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getLiveTrackingData(bounds?: GeoBounds): Promise<GP51LiveData> {
    const positions = await this.dataService.getPositions();
    
    // Filter positions if bounds provided
    let filteredPositions = positions;
    if (bounds) {
      filteredPositions = positions.filter(pos => 
        pos.latitude >= bounds.south && 
        pos.latitude <= bounds.north &&
        pos.longitude >= bounds.west && 
        pos.longitude <= bounds.east
      );
    }
    
    // Return proper GP51LiveData structure
    return {
      positions: filteredPositions,
      lastUpdate: new Date(),
      
      // Implement required methods
      filter(predicate: (item: GP51Position) => boolean): GP51Position[] {
        return this.positions.filter(predicate);
      },
      
      get length(): number {
        return this.positions.length;
      }
    };
  }

  async testConnection(): Promise<GP51HealthStatus> {
    return this.dataService.testConnection();
  }
}

export const gp51CompleteAPIController = new GP51CompleteAPIController();
