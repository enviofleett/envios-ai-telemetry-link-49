
import { VehicleData, VehicleDataMetrics } from './types';

export class MetricsCalculator {
  static calculateMetrics(vehicles: VehicleData[], lastSyncTime: Date, syncStatus: 'success' | 'error' | 'in_progress', errorMessage?: string): VehicleDataMetrics {
    const now = Date.now();
    const recentThreshold = 30 * 60 * 1000; // 30 minutes

    return {
      totalVehicles: vehicles.length,
      onlineVehicles: vehicles.filter(v => v.status === 'online').length,
      offlineVehicles: vehicles.filter(v => v.status === 'offline').length,
      recentlyActiveVehicles: vehicles.filter(v => 
        now - v.lastUpdate.getTime() <= recentThreshold
      ).length,
      lastSyncTime,
      syncStatus,
      errorMessage
    };
  }
}
