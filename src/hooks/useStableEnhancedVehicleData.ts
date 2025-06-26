
import { useState, useEffect } from 'react';
import { enhancedVehicleDataService, type VehicleData } from '@/services/EnhancedVehicleDataService';

export const useStableEnhancedVehicleData = () => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userOptions, setUserOptions] = useState<any[]>([]);

  useEffect(() => {
    const subscriberId = `stable-enhanced-${Date.now()}`;
    
    enhancedVehicleDataService.subscribe(subscriberId, (data) => {
      setVehicles(data.vehicles);
      setFilteredVehicles(data.vehicles);
      setIsLoading(data.isLoading);
      setError(data.error);
      
      // Generate user options from vehicle data
      const options = data.vehicles.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.vehicleName || vehicle.device_name,
        email: `${vehicle.device_name}@fleet.local`
      }));
      setUserOptions(options);
    });

    // Load initial data
    enhancedVehicleDataService.getVehicleData();

    return () => {
      enhancedVehicleDataService.unsubscribe(subscriberId);
    };
  }, []);

  return {
    vehicles,
    filteredVehicles,
    isLoading,
    error,
    userOptions
  };
};
