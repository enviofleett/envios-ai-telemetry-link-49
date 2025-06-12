
import type { VehicleData } from '@/types/vehicle';

export const getVehicleStatus = (vehicle: VehicleData) => {
  if (!vehicle.lastPosition?.updatetime) return 'offline';
  
  const lastUpdate = new Date(vehicle.lastPosition.updatetime);
  const now = new Date();
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
  
  if (minutesSinceUpdate > 5) return 'offline';
  if (vehicle.lastPosition.speed > 0) return 'moving';
  return 'online';
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'moving': return '#3b82f6'; // Blue
    case 'online': return '#22c55e'; // Green
    default: return '#ef4444'; // Red
  }
};
