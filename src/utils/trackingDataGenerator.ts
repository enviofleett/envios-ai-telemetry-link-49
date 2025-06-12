
import type { VehicleData, EnhancedVehicle } from '@/types/vehicle';

export const convertToEnhancedVehicle = (vehicle: VehicleData): EnhancedVehicle => {
  return {
    id: vehicle.id,
    deviceId: vehicle.deviceId,
    deviceName: vehicle.deviceName,
    plateNumber: vehicle.vehicleName || vehicle.deviceName,
    model: vehicle.make && vehicle.model ? `${vehicle.make} ${vehicle.model}` : 'Unknown Model',
    driver: 'Unknown Driver', // Mock data since not available in VehicleData
    speed: vehicle.speed || vehicle.lastPosition?.speed || 0,
    fuel: vehicle.fuel || Math.floor(Math.random() * 100), // Mock if not available
    lastUpdate: vehicle.lastUpdate,
    status: vehicle.status as 'active' | 'idle' | 'maintenance' | 'offline',
    isOnline: vehicle.isOnline,
    isMoving: vehicle.isMoving,
    
    // Optional compatibility properties
    deviceid: vehicle.deviceId,
    devicename: vehicle.deviceName,
    vehicle_name: vehicle.vehicleName,
    make: vehicle.make,
    year: vehicle.year,
    license_plate: vehicle.licensePlate,
    is_active: vehicle.is_active,
    lastPosition: vehicle.lastPosition ? {
      lat: vehicle.lastPosition.lat,
      lng: vehicle.lastPosition.lon, // Convert lon to lng
      speed: vehicle.lastPosition.speed,
      course: vehicle.lastPosition.course,
      updatetime: vehicle.lastPosition.timestamp.toISOString(),
      statusText: vehicle.lastPosition.statusText
    } : undefined
  };
};
