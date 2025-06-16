
import { useState, useEffect } from 'react';
import type { VehicleData, VehiclePosition } from '@/types/vehicle';

export const useGP51VehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mockVehiclePosition: VehiclePosition = { 
    latitude: 40.7128, 
    longitude: -74.0060,
    speed: 0,
    course: 0,
    timestamp: new Date().toISOString()
  };

  useEffect(() => {
    // Mock implementation
    setVehicles([]);
  }, []);

  return {
    vehicles,
    isLoading,
    refetch: () => {},
  };
};
