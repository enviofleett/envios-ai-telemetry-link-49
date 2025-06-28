
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
import { gp51DataService } from './GP51DataService';
import { safeToString, createDefaultFleetData } from '@/types/gp51-unified';

interface GeoBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export class GP51CompleteAPIController {
  constructor() {}

  async getHealthStatus(): Promise<GP51HealthStatus> {
    return gp51DataService.getHealthStatus();
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics> {
    return gp51DataService.getPerformanceMetrics();
  }

  async queryMonitorList(): Promise<{
    success: boolean;
    data?: GP51Device[];
    groups?: GP51Group[];
    error?: string;
  }> {
    return gp51DataService.queryMonitorList();
  }

  async getPositions(): Promise<GP51Position[]> {
    return gp51DataService.getPositions();
  }

  async getMultipleDevicesLastPositions(deviceIds: string[]): Promise<Map<string, GP51Position>> {
    const positions = await gp51DataService.getMultipleDevicesLastPositions(deviceIds);
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
    return gp51DataService.getLiveVehicles();
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

      let filteredDevices = devicesResult.data || [];
      if (options?.groupFilter) {
        const groupFilterStrings = options.groupFilter.map(id => 
          safeToString(id)
        );
        filteredDevices = filteredDevices.filter(device => 
          device.groupname && groupFilterStrings.includes(device.groupname)
        );
      }

      const fleetData: GP51FleetData = {
        devices: filteredDevices,
        positions: positions,
        groups: devicesResult.groups || [],
        summary: {
          totalDevices: filteredDevices.length,
          activeDevices: filteredDevices.filter(d => d.isActive || d.isfree === 1).length,
          onlineDevices: filteredDevices.filter(d => d.isOnline).length,
          movingDevices: filteredDevices.filter(d => Boolean(d.isfree === 1)).length,
          alertCount: 0
        },
        lastUpdate: new Date().toISOString(),
        metadata: {
          requestId: Math.random().toString(36).substring(7),
          responseTime: Date.now() - startTime,
          dataVersion: "1.0",
          source: "GP51API",
          fetchTime: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          version: "1.0"
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
    const positions = await gp51DataService.getPositions();
    
    // Filter positions if bounds provided
    let filteredPositions = positions;
    if (bounds) {
      filteredPositions = positions.filter(pos => 
        pos.callat >= bounds.south && 
        pos.callat <= bounds.north &&
        pos.callon >= bounds.west && 
        pos.callon <= bounds.east
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
    return gp51DataService.getHealthStatus();
  }
}

export const gp51CompleteAPIController = new GP51CompleteAPIController();
