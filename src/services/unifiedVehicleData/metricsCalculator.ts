
import { VehicleData, VehicleMetrics } from '@/types/vehicle';

export class MetricsCalculator {
  static calculateVehicleMetrics(vehicles: VehicleData[]): VehicleMetrics {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const online = vehicles.filter(v => {
      if (!v.lastPosition?.timestamp) return false;
      return v.lastPosition.timestamp > thirtyMinutesAgo;
    }).length;

    const alerts = vehicles.filter(v => {
      if (!v.lastPosition?.timestamp) return false;
      return v.lastPosition.timestamp > thirtyMinutesAgo && 
             (v.status?.toLowerCase().includes('alert') || 
              v.status?.toLowerCase().includes('alarm'));
    }).length;

    return {
      total: vehicles.length,
      online,
      offline: vehicles.length - online,
      alerts,
      lastUpdateTime: now
    };
  }

  static calculateSyncMetrics(vehicles: VehicleData[]) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const recentlyUpdated = vehicles.filter(v => {
      if (!v.lastPosition?.timestamp) return false;
      return v.lastPosition.timestamp > oneHourAgo;
    }).length;

    const withErrors = vehicles.filter(v => {
      if (!v.lastPosition?.timestamp) return false;
      return v.lastPosition.timestamp > oneHourAgo &&
             v.status?.toLowerCase().includes('error');
    }).length;

    return {
      totalVehicles: vehicles.length,
      positionsUpdated: recentlyUpdated,
      errors: withErrors,
      lastSyncTime: now
    };
  }
}
