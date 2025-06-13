
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
