
import { Vehicle, VehiclePosition } from '@/types/vehicle';

// Type guard to safely cast Json to VehiclePosition
export const isVehiclePosition = (data: any): data is VehiclePosition => {
  return data && typeof data === 'object' && 
         typeof data.lat === 'number' && 
         typeof data.lon === 'number' && 
         typeof data.speed === 'number' && 
         typeof data.course === 'number' && 
         typeof data.updatetime === 'string' && 
         typeof data.statusText === 'string';
};

export const isVehicleOnline = (vehicle: Vehicle): boolean => {
  if (!vehicle.last_position) return false;
  const now = new Date();
  const positionTime = new Date(vehicle.last_position.updatetime);
  const minutesDiff = (now.getTime() - positionTime.getTime()) / (1000 * 60);
  return minutesDiff <= 30;
};
