
import type { VehicleData } from '@/types/vehicle';
import type { VehicleDataMetrics } from './types';

export class MetricsCalculator {
  static calculateMetrics(vehicles: VehicleData[]): VehicleDataMetrics {
    const total = vehicles.length;
    const online = vehicles.filter(v => v.status === 'online').length;
    const offline = vehicles.filter(v => v.status === 'offline').length;
    const idle = vehicles.filter(v => v.status === 'idle').length;
    const alerts = vehicles.filter(v => v.alerts && v.alerts.length > 0).length;

    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    const recentlyActive = vehicles.filter(v => {
      const lastUpdate = v.lastUpdate ? v.lastUpdate.getTime() : 0;
      return lastUpdate > thirtyMinutesAgo;
    }).length;

    return {
      total,
      online,
      offline,
      idle,
      alerts,
      totalVehicles: total,
      onlineVehicles: online,
      offlineVehicles: offline,
      recentlyActiveVehicles: recentlyActive,
      lastSyncTime: new Date(),
      positionsUpdated: vehicles.length,
      errors: 0,
      syncStatus: 'success'
    };
  }
}
