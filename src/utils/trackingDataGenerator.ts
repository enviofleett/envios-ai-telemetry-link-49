
import type { VehicleData, EnhancedVehicle, FuelRecord, EngineRecord, MileageRecord } from '@/types/vehicle';

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
    
    // Additional properties for analytics
    location: vehicle.location?.address || vehicle.position?.address || 'Unknown Location',
    engineHours: Math.floor(Math.random() * 8000) + 1000, // Mock engine hours
    mileage: Math.floor(Math.random() * 200000) + 50000, // Mock mileage
    fuelType: 'Gasoline', // Mock fuel type
    engineSize: 2.0 + Math.random() * 2, // Mock engine size between 2.0-4.0L
    
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

export const generateFuelData = (days: number = 30): FuelRecord[] => {
  const data: FuelRecord[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      consumption: Math.random() * 50 + 10, // 10-60 liters
      efficiency: Math.random() * 10 + 15, // 15-25 km/l
      cost: Math.random() * 500 + 100, // $100-600
    });
  }
  return data.reverse();
};

export const generateEngineData = (days: number = 30): EngineRecord[] => {
  const data: EngineRecord[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      engineHours: Math.random() * 8 + 1, // 1-9 hours per day
      idleTime: Math.random() * 2, // 0-2 hours idle
      utilization: Math.random() * 100, // 0-100% utilization
      performance: Math.random() * 20 + 80, // 80-100% performance
    });
  }
  return data.reverse();
};

export const generateMileageData = (days: number = 30): MileageRecord[] => {
  const data: MileageRecord[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      distance: Math.random() * 500 + 50, // 50-550 km
      trips: Math.floor(Math.random() * 5) + 1, // 1-5 trips
      estimatedFuel: Math.random() * 50 + 10, // 10-60 liters
      activity: Math.random() * 100, // 0-100% activity level
    });
  }
  return data.reverse();
};
