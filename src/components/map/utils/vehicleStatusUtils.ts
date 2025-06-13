
import type { VehicleData } from '@/types/vehicle';

export const getVehicleStatus = (vehicle: VehicleData) => {
  if (!vehicle.last_position?.timestamp) return 'offline';
  
  const lastUpdate = new Date(vehicle.last_position.timestamp);
  const now = new Date();
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
  
  if (minutesSinceUpdate > 5) return 'offline';
  if (vehicle.last_position.speed > 0) return 'moving';
  return 'online';
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'moving': return '#3b82f6'; // Blue
    case 'online': return '#22c55e'; // Green
    default: return '#ef4444'; // Red
  }
};
