
import type { VehicleData, VehiclePosition } from '@/types/vehicle';

const mockLastPosition: VehiclePosition = {
  lat: 40.7128,
  lng: -74.0060,
  speed: 0,
  course: 0,
  timestamp: new Date(),
  statusText: 'parked'
};

export const loadMockVehicleData = (): VehicleData[] => {
  return Array.from({ length: 50 }, (_, index) => {
    const speed = Math.floor(Math.random() * 80);
    const isMoving = speed > 5;
    const isOnline = Math.random() > 0.2;
    
    const last_position: VehiclePosition = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.0060 + (Math.random() - 0.5) * 0.1,
      speed,
      course: Math.floor(Math.random() * 360),
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      statusText: isMoving ? 'moving' : 'idle'
    };

    return {
      id: `vehicle-${index + 1}`,
      device_id: `device-${String(index + 1).padStart(3, '0')}`,
      device_name: `Vehicle ${index + 1}`,
      vin: `VIN${String(index + 1).padStart(8, '0')}`,
      license_plate: `ABC-${String(index + 1).padStart(3, '0')}`,
      is_active: isOnline,
      last_position,
      status: isOnline ? (isMoving ? 'moving' : 'idle') : 'offline',
      lastUpdate: new Date(Date.now() - Math.random() * 3600000),
      isOnline,
      isMoving,
      alerts: Math.random() > 0.8 ? ['Low fuel', 'Maintenance due'] : [],
      // Legacy compatibility
      deviceId: `device-${String(index + 1).padStart(3, '0')}`,
      deviceName: `Vehicle ${index + 1}`,
      lastPosition: last_position
    };
  });
};

export const loadMockVehicleDataForMap = (): VehicleData[] => {
  const baseLocations = [
    { lat: 40.7589, lng: -73.9851, name: 'Times Square Area' },
    { lat: 40.7614, lng: -73.9776, name: 'Central Park South' },
    { lat: 40.7505, lng: -73.9934, name: 'Penn Station Area' },
    { lat: 40.7128, lng: -74.0060, name: 'Financial District' },
    { lat: 40.7831, lng: -73.9712, name: 'Upper East Side' }
  ];

  return Array.from({ length: 15 }, (_, index) => {
    const baseLocation = baseLocations[index % baseLocations.length];
    const speed = Math.floor(Math.random() * 60);
    const isMoving = speed > 5;
    const isOnline = Math.random() > 0.15;
    
    const last_position: VehiclePosition = {
      lat: baseLocation.lat + (Math.random() - 0.5) * 0.01,
      lng: baseLocation.lng + (Math.random() - 0.5) * 0.01,
      speed,
      course: Math.floor(Math.random() * 360),
      timestamp: new Date(Date.now() - Math.random() * 1800000),
      statusText: isMoving ? 'moving' : isOnline ? 'idle' : 'offline'
    };

    return {
      id: `map-vehicle-${index + 1}`,
      device_id: `mv-${String(index + 1).padStart(3, '0')}`,
      device_name: `${baseLocation.name.split(' ')[0]} Unit ${index + 1}`,
      vin: `MVVIN${String(index + 1).padStart(5, '0')}`,
      license_plate: `NY-${String(index + 1).padStart(4, '0')}`,
      is_active: isOnline,
      last_position,
      status: isOnline ? (isMoving ? 'moving' : 'idle') : 'offline',
      lastUpdate: new Date(Date.now() - Math.random() * 1800000),
      isOnline,
      isMoving,
      alerts: Math.random() > 0.9 ? ['GPS signal weak'] : [],
      // Legacy compatibility
      deviceId: `mv-${String(index + 1).padStart(3, '0')}`,
      deviceName: `${baseLocation.name.split(' ')[0]} Unit ${index + 1}`,
      lastPosition: last_position
    };
  });
};
