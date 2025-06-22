
import { useState, useCallback } from 'react';

export interface VehicleControlState {
  engineRunning: boolean;
  locked: boolean;
  isLoading: boolean;
}

export interface UseVehicleControlsReturn {
  controlStates: Record<string, VehicleControlState>;
  isUpdating: boolean;
  toggleEngine: (vehicleId: string) => Promise<void>;
  toggleLock: (vehicleId: string) => Promise<void>;
}

export const useVehicleControls = (vehicles: any[]): UseVehicleControlsReturn => {
  const [controlStates, setControlStates] = useState<Record<string, VehicleControlState>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Initialize control states for vehicles
  React.useEffect(() => {
    const newStates: Record<string, VehicleControlState> = {};
    vehicles.forEach(vehicle => {
      if (vehicle.id && !controlStates[vehicle.id]) {
        newStates[vehicle.id] = {
          engineRunning: false,
          locked: true,
          isLoading: false
        };
      }
    });
    
    if (Object.keys(newStates).length > 0) {
      setControlStates(prev => ({ ...prev, ...newStates }));
    }
  }, [vehicles]);

  const toggleEngine = useCallback(async (vehicleId: string) => {
    setIsUpdating(true);
    setControlStates(prev => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        isLoading: true
      }
    }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setControlStates(prev => ({
        ...prev,
        [vehicleId]: {
          ...prev[vehicleId],
          engineRunning: !prev[vehicleId]?.engineRunning,
          isLoading: false
        }
      }));
    } catch (error) {
      console.error('Failed to toggle engine:', error);
      setControlStates(prev => ({
        ...prev,
        [vehicleId]: {
          ...prev[vehicleId],
          isLoading: false
        }
      }));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const toggleLock = useCallback(async (vehicleId: string) => {
    setIsUpdating(true);
    setControlStates(prev => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        isLoading: true
      }
    }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setControlStates(prev => ({
        ...prev,
        [vehicleId]: {
          ...prev[vehicleId],
          locked: !prev[vehicleId]?.locked,
          isLoading: false
        }
      }));
    } catch (error) {
      console.error('Failed to toggle lock:', error);
      setControlStates(prev => ({
        ...prev,
        [vehicleId]: {
          ...prev[vehicleId],
          isLoading: false
        }
      }));
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    controlStates,
    isUpdating,
    toggleEngine,
    toggleLock
  };
};
