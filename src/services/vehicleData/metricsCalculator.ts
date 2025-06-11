
import { VehicleData, VehicleDataMetrics } from './types';

export class MetricsCalculator {
  static calculateMetrics(
    vehicles: VehicleData[], 
    lastSyncTime: Date, 
    syncStatus: 'success' | 'error' | 'in_progress',
    errorMessage?: string
  ): VehicleDataMetrics {
    const totalVehicles = vehicles.length;
    const onlineVehicles = vehicles.filter(v => v.status === 'online' || v.status === 'moving' || v.status === 'idle').length;
    const offlineVehicles = vehicles.filter(v => v.status === 'offline').length;
    
    // Recently active = updated within last 30 minutes
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    const recentlyActiveVehicles = vehicles.filter(v => v.lastUpdate.getTime() > thirtyMinutesAgo).length;

    return {
      totalVehicles,
      onlineVehicles,
      offlineVehicles,
      recentlyActiveVehicles,
      lastSyncTime,
      syncStatus,
      errorMessage
    };
  }
}
