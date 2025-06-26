
import type { VehicleData, VehicleDataMetrics } from '@/types/vehicle';

export const calculateVehicleMetrics = (vehicles: VehicleData[]): VehicleDataMetrics => {
  const total = vehicles.length;
  const online = vehicles.filter(v => v.isOnline).length;
  const offline = total - online;
  
  // Calculate idle vehicles (online but not moving)
  const idle = vehicles.filter(v => {
    if (!v.last_position?.timestamp) return false;
    const lastUpdate = new Date(v.last_position.timestamp);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    return v.isOnline && !v.isMoving && minutesSinceUpdate <= 30;
  }).length;

  const alerts = vehicles.reduce((sum, v) => sum + v.alerts.length, 0);

  // Calculate recently active vehicles (active in last 30 minutes)
  const recentlyActive = vehicles.filter(v => {
    if (!v.last_position?.timestamp) return false;
    const lastUpdate = new Date(v.last_position.timestamp);
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    return lastUpdate.getTime() > thirtyMinutesAgo;
  }).length;

  return {
    // Dashboard-compatible properties
    total,
    online,
    offline,
    idle,
    alerts,
    // Legacy properties
    totalVehicles: total,
    onlineVehicles: online,
    offlineVehicles: offline,
    movingVehicles: vehicles.filter(v => v.isMoving).length,
    idleVehicles: idle,
    recentlyActiveVehicles: recentlyActive,
    // Sync properties
    lastSyncTime: new Date(),
    averageSpeed: 0,
    totalDistance: 0,
    syncStatus: 'success' as const,
    errors: []
  };
};
