
import type { VehicleData } from '@/types/vehicle';

export const generateTripData = (vehicles: VehicleData[]) => {
  return vehicles.slice(0, 10).map((vehicle, index) => ({
    id: `trip-${vehicle.device_id}-${index}`,
    vehicleId: vehicle.device_id,
    vehicleName: vehicle.device_name,
    driverName: `Driver ${vehicle.device_name.split(' ')[1] || index + 1}`,
    startTime: '08:30 AM',
    endTime: '05:45 PM',
    duration: '9h 15m',
    distance: `${Math.floor(Math.random() * 200 + 50)} km`,
    avgSpeed: vehicle.last_position ? `${Math.floor(vehicle.last_position.speed)} km/h` : '0 km/h',
    maxSpeed: '85 km/h',
    fuelUsed: '12.5L',
    status: Math.random() > 0.8 ? 'Alert' : 'Normal'
  }));
};

export const generateGeofenceData = (vehicles: VehicleData[]) => {
  return vehicles.slice(0, 8).map((vehicle, index) => ({
    id: `geofence-${vehicle.device_id}-${index}`,
    vehicleId: vehicle.device_id,
    vehicleName: vehicle.device_name,
    geofenceName: `Zone ${index + 1}`,
    eventType: Math.random() > 0.5 ? 'Enter' : 'Exit',
    timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toLocaleString(),
    plateNumber: vehicle.license_plate || `ABC-${index + 1}`,
    driverName: `Driver ${index + 1}`,
    location: vehicle.last_position ? {
      lat: vehicle.last_position.lat,
      lng: vehicle.last_position.lng,
      speed: vehicle.last_position.speed,
      course: vehicle.last_position.course,
      timestamp: vehicle.last_position.timestamp
    } : null,
    duration: `${Math.floor(Math.random() * 120 + 10)} minutes`,
    status: Math.random() > 0.7 ? 'Violation' : 'Normal'
  }));
};

export const generateFuelData = (vehicles: VehicleData[]) => {
  return vehicles.slice(0, 30).map((vehicle, index) => ({
    date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString(),
    consumption: Math.floor(Math.random() * 50 + 20),
    efficiency: Math.random() * 5 + 8,
    cost: Math.floor(Math.random() * 200 + 100),
    distance: Math.floor(Math.random() * 300 + 100),
    performance: Math.random() * 20 + 80
  }));
};

export const generateEngineData = (vehicles: VehicleData[]) => {
  return vehicles.slice(0, 30).map((vehicle, index) => ({
    date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString(),
    engineHours: Math.floor(Math.random() * 12 + 4),
    idleTime: Math.floor(Math.random() * 4 + 1),
    utilization: Math.random() * 30 + 70,
    performance: Math.random() * 20 + 80,
    trips: Math.floor(Math.random() * 8 + 2),
    estimatedFuel: Math.floor(Math.random() * 40 + 15),
    activity: Math.random() * 20 + 80
  }));
};

export const generateMileageData = (vehicles: VehicleData[]) => {
  return vehicles.slice(0, 30).map((vehicle, index) => ({
    date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toLocaleDateString(),
    distance: Math.floor(Math.random() * 300 + 100),
    trips: Math.floor(Math.random() * 8 + 2),
    estimatedFuel: Math.floor(Math.random() * 40 + 15),
    activity: Math.random() * 20 + 80,
    consumption: Math.floor(Math.random() * 50 + 20),
    efficiency: Math.random() * 5 + 8,
    cost: Math.floor(Math.random() * 200 + 100),
    engineHours: Math.floor(Math.random() * 12 + 4),
    idleTime: Math.floor(Math.random() * 4 + 1),
    utilization: Math.random() * 30 + 70,
    performance: Math.random() * 20 + 80
  }));
};

export const convertToEnhancedVehicle = (vehicle: VehicleData) => {
  return {
    id: vehicle.id,
    deviceId: vehicle.device_id,
    deviceName: vehicle.device_name,
    plateNumber: vehicle.license_plate || 'N/A',
    model: 'Unknown Model',
    driver: 'Unknown Driver',
    speed: vehicle.last_position?.speed || 0,
    fuel: Math.floor(Math.random() * 100),
    lastUpdate: new Date(vehicle.last_position?.timestamp || Date.now()),
    status: vehicle.status as 'active' | 'idle' | 'maintenance' | 'offline',
    isOnline: vehicle.isOnline || false,
    isMoving: vehicle.isMoving || false,
    location: {
      lat: vehicle.last_position?.lat || 0,
      lng: vehicle.last_position?.lng || 0,
      address: 'Unknown Location'
    },
    engineHours: Math.floor(Math.random() * 1000 + 100),
    mileage: Math.floor(Math.random() * 50000 + 10000),
    fuelType: 'Diesel',
    engineSize: 2.0
  };
};
