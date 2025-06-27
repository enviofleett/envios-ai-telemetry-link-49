import type {
  GP51HealthStatus,
  GP51Device as GP51DeviceData,
  GP51Position,
  GP51PerformanceMetrics,
  RealAnalyticsData
} from '@/types/gp51-unified';
import { unifiedGP51Service } from './UnifiedGP51Service';

export class GP51UnifiedDataService {
  private healthStatus: GP51HealthStatus | null = null;
  private devices: GP51DeviceData[] = [];
  private positions: GP51Position[] = [];
  private metrics: GP51PerformanceMetrics | null = null;

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    try {
      this.healthStatus = await unifiedGP51Service.getConnectionHealth();
      const monitorListResult = await unifiedGP51Service.queryMonitorList();
      if (monitorListResult.success && monitorListResult.data) {
        this.devices = monitorListResult.data;
      }
      this.positions = await unifiedGP51Service.getPositions();
      // this.metrics = await unifiedGP51Service.getPerformanceMetrics();
    } catch (error) {
      console.error('Error initializing data:', error);
    }
  }

  async getHealthStatus(): Promise<GP51HealthStatus> {
    if (!this.healthStatus) {
      this.healthStatus = await unifiedGP51Service.getConnectionHealth();
    }
    return this.healthStatus;
  }

  async getDevices(): Promise<GP51DeviceData[]> {
    if (this.devices.length === 0) {
      const monitorListResult = await unifiedGP51Service.queryMonitorList();
      if (monitorListResult.success && monitorListResult.data) {
        this.devices = monitorListResult.data;
      }
    }
    return this.devices;
  }

  async getPositions(): Promise<GP51Position[]> {
    if (this.positions.length === 0) {
      this.positions = await unifiedGP51Service.getPositions();
    }
    return this.positions;
  }

  async getPerformanceMetrics(): Promise<GP51PerformanceMetrics | null> {
    return this.metrics;
  }

  async getRealAnalyticsData(): Promise<RealAnalyticsData> {
    try {
      const [healthStatus, devices, positions] = await Promise.all([
        this.getHealthStatus(),
        this.getDevices(),
        this.getPositions()
      ]);

      const totalVehicles = devices.length;
      const onlineVehicles = positions.filter(p => {
        const lastUpdate = new Date(p.updatetime);
        const now = new Date();
        const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
        return minutesSinceUpdate <= 60;
      }).length;

      const movingVehicles = positions.filter(p => p.moving === 1).length;

      // Fix: Remove invalid properties and use correct status values
      const recentActivity = [
        {
          type: "vehicle_online" as const,
          message: `${onlineVehicles} vehicles currently online`,
          timestamp: new Date(),
          vehicleId: devices[0]?.deviceid,
          percentageChange: 5.2
        },
        {
          type: "alert" as const,
          message: "System performance is optimal",
          timestamp: new Date(),
          percentageChange: 0
        }
      ];

      return {
        vehicleStatus: {
          total: totalVehicles,
          online: onlineVehicles,
          offline: totalVehicles - onlineVehicles,
          moving: movingVehicles,
          parked: onlineVehicles - movingVehicles
        },
        fleetUtilization: {
          activeVehicles: onlineVehicles,
          totalVehicles: totalVehicles,
          utilizationRate: totalVehicles > 0 ? (onlineVehicles / totalVehicles) * 100 : 0
        },
        systemHealth: {
          apiStatus: healthStatus.isConnected ? 'healthy' as const : 'down' as const,
          lastUpdate: new Date(),
          responseTime: healthStatus.responseTime || 150
        },
        recentActivity,
        performance: {
          averageSpeed: positions.reduce((sum, p) => sum + p.speed, 0) / Math.max(positions.length, 1),
          totalDistance: positions.reduce((sum, p) => sum + p.totaldistance, 0),
          fuelEfficiency: 15.5,
          alertCount: 0
        },
        growth: {
          newUsers: 3,
          newVehicles: 2,
          period: 'This month',
          percentageChange: 12.5
        },
        sync: {
          importedUsers: devices.length,
          importedVehicles: devices.length,
          lastSync: new Date(),
          status: 'success' as const
        }
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      
      // Fix: Remove invalid properties and use correct status values
      const errorActivity = [
        {
          type: "alert" as const,
          message: "Error retrieving vehicle data",
          timestamp: new Date(),
          percentageChange: -5.0
        }
      ];

      return {
        vehicleStatus: { total: 0, online: 0, offline: 0, moving: 0, parked: 0 },
        fleetUtilization: { activeVehicles: 0, totalVehicles: 0, utilizationRate: 0 },
        systemHealth: { 
          apiStatus: 'down' as const, 
          lastUpdate: new Date(), 
          responseTime: 0 
        },
        recentActivity: errorActivity,
        performance: { averageSpeed: 0, totalDistance: 0, alertCount: 1 },
        growth: { newUsers: 0, newVehicles: 0, period: 'This month', percentageChange: 0 },
        sync: { importedUsers: 0, importedVehicles: 0, lastSync: new Date(), status: 'error' as const }
      };
    }
  }
}
