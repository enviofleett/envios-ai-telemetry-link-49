
import { useState, useEffect } from 'react';
import { telemetryApi } from '@/services/telemetryApi';

interface Vehicle {
  deviceid: string;
  devicename: string;
  status?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
}

export const useVehicleData = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVehicles = async () => {
    try {
      console.log('Fetching vehicles...');
      const result = await telemetryApi.getVehiclePositions();
      
      if (result.success && result.positions) {
        console.log('Vehicles received:', result.positions);
        // Convert positions to vehicles format
        const vehiclesData = result.positions.map(pos => ({
          deviceid: pos.deviceid,
          devicename: pos.deviceid, // Using deviceid as name for now
          status: 'active',
          lastPosition: {
            lat: pos.lat,
            lon: pos.lon,
            speed: pos.speed,
            course: pos.course,
            updatetime: pos.updatetime,
            statusText: pos.statusText
          }
        }));
        setVehicles(vehiclesData);
      } else {
        console.error('Failed to fetch vehicles:', result.error);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      console.log('Fetching vehicle positions...');
      const deviceIds = vehicles.map(v => v.deviceid);
      if (deviceIds.length === 0) return;
      
      const result = await telemetryApi.getVehiclePositions(deviceIds);
      
      if (result.success && result.positions) {
        console.log('Positions received:', result.positions);
        
        // Update vehicles with position data
        setVehicles(currentVehicles => 
          currentVehicles.map(vehicle => {
            const position = result.positions?.find(p => p.deviceid === vehicle.deviceid);
            if (position) {
              return {
                ...vehicle,
                lastPosition: {
                  lat: position.lat,
                  lon: position.lon,
                  speed: position.speed,
                  course: position.course,
                  updatetime: position.updatetime,
                  statusText: position.statusText
                }
              };
            }
            return vehicle;
          })
        );
      } else {
        console.error('Failed to fetch positions:', result.error);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  return {
    vehicles,
    isLoading,
    fetchVehicles,
    fetchPositions
  };
};
