
import type { VehicleData, VehicleMetrics } from '@/types/vehicle';

export class VehicleMetricsCalculator {
  public calculateMetrics(vehicles: VehicleData[], totalVehiclesInDatabase: number): VehicleMetrics {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Calculate online/offline based on loaded vehicles with position data
    const vehiclesWithPositions = vehicles.filter(v => v.lastPosition?.updatetime);
    const onlineVehicles = vehiclesWithPositions.filter(v => 
      new Date(v.lastPosition!.updatetime) > thirtyMinutesAgo
    );
    const offlineVehicles = vehiclesWithPositions.filter(v => 
      new Date(v.lastPosition!.updatetime) <= thirtyMinutesAgo
    );

    // Calculate alerts from all loaded vehicles
    const alertVehicles = vehicles.filter(v => 
      v.status?.toLowerCase().includes('alert') || 
      v.status?.toLowerCase().includes('alarm')
    );

    const metrics = {
      total: totalVehiclesInDatabase, // Always use database total
      online: onlineVehicles.length,
      offline: offlineVehicles.length,
      alerts: alertVehicles.length,
      lastUpdateTime: now
    };

    console.log(`Metrics updated - Total: ${metrics.total}, Online: ${metrics.online}, Offline: ${metrics.offline}, Alerts: ${metrics.alerts}`);
    return metrics;
  }

  public getOnlineVehicles(vehicles: VehicleData[]): VehicleData[] {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return vehicles.filter(v => 
      v.lastPosition?.updatetime && 
      new Date(v.lastPosition.updatetime) > thirtyMinutesAgo
    );
  }

  public getOfflineVehicles(vehicles: VehicleData[]): VehicleData[] {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    return vehicles.filter(v => 
      v.lastPosition?.updatetime && 
      new Date(v.lastPosition.updatetime) <= thirtyMinutesAgo
    );
  }

  public getVehiclesWithAlerts(vehicles: VehicleData[]): VehicleData[] {
    return vehicles.filter(v => 
      v.status?.toLowerCase().includes('alert') || 
      v.status?.toLowerCase().includes('alarm')
    );
  }
}
