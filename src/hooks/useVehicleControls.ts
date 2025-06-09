
import { useState, useEffect } from 'react';
import { GP51ProductionService } from '@/services/gp51ProductionService';
import { useToast } from '@/hooks/use-toast';

interface VehicleControlState {
  engineState: Record<string, boolean>;
  lockState: Record<string, boolean>;
}

export const useVehicleControls = (vehicles: any[]) => {
  const [controlStates, setControlStates] = useState<VehicleControlState>({
    engineState: {},
    lockState: {}
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Initialize control states
  useEffect(() => {
    const newEngineState: Record<string, boolean> = {};
    const newLockState: Record<string, boolean> = {};

    vehicles.forEach((vehicle) => {
      const hasIgnitionData = vehicle.lastPosition?.statusText?.includes('ignition') || 
                              vehicle.lastPosition?.statusText?.includes('engine');
      newEngineState[vehicle.deviceid] = hasIgnitionData || false;
      newLockState[vehicle.deviceid] = true; // Default to locked
    });

    setControlStates({
      engineState: newEngineState,
      lockState: newLockState
    });
  }, [vehicles]);

  const toggleEngine = async (deviceId: string) => {
    setIsUpdating(true);
    try {
      const newState = !controlStates.engineState[deviceId];
      
      const result = await GP51ProductionService.performRealDeviceHandshake(
        deviceId,
        'admin-token'
      );

      if (result.success) {
        setControlStates(prev => ({
          ...prev,
          engineState: {
            ...prev.engineState,
            [deviceId]: newState
          }
        }));

        toast({
          title: `Engine ${newState ? 'Started' : 'Stopped'}`,
          description: `Vehicle ${deviceId} engine has been ${newState ? 'started' : 'stopped'} remotely`,
        });
      } else {
        toast({
          title: "Command Failed",
          description: result.error || "Failed to control engine",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Control Error",
        description: "Unable to communicate with vehicle",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleLock = async (deviceId: string) => {
    setIsUpdating(true);
    try {
      const newState = !controlStates.lockState[deviceId];
      
      setControlStates(prev => ({
        ...prev,
        lockState: {
          ...prev.lockState,
          [deviceId]: newState
        }
      }));

      toast({
        title: `Doors ${newState ? 'Locked' : 'Unlocked'}`,
        description: `Vehicle ${deviceId} doors have been ${newState ? 'locked' : 'unlocked'}`,
      });
    } catch (error) {
      toast({
        title: "Lock Control Error",
        description: "Unable to control door locks",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    controlStates,
    isUpdating,
    toggleEngine,
    toggleLock
  };
};
