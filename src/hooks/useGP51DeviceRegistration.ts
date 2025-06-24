
import { useState } from 'react';
import { GP51DeviceRegistrationService, GP51DeviceCreationData, GP51DeviceCreationResult } from '@/services/gp51/GP51DeviceRegistrationService';

export const useGP51DeviceRegistration = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isCheckingDevice, setIsCheckingDevice] = useState(false);

  const createGP51Device = async (deviceData: GP51DeviceCreationData): Promise<GP51DeviceCreationResult> => {
    setIsCreating(true);
    try {
      // Validate device data first
      const validation = await GP51DeviceRegistrationService.validateDeviceData(deviceData);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join(', ')}`,
          errorCode: 'VALIDATION_ERROR'
        };
      }

      // Create the GP51 device
      const result = await GP51DeviceRegistrationService.createGP51Device(deviceData);
      return result;

    } catch (error) {
      console.error('Error in useGP51DeviceRegistration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during device creation',
        errorCode: 'HOOK_ERROR'
      };
    } finally {
      setIsCreating(false);
    }
  };

  const checkDeviceAvailability = async (deviceId: string): Promise<{ available: boolean; error?: string }> => {
    setIsCheckingDevice(true);
    try {
      const result = await GP51DeviceRegistrationService.checkDeviceAvailability(deviceId);
      return result;
    } catch (error) {
      console.error('Error checking device availability:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error during device check'
      };
    } finally {
      setIsCheckingDevice(false);
    }
  };

  const validateDeviceData = async (deviceData: GP51DeviceCreationData) => {
    return await GP51DeviceRegistrationService.validateDeviceData(deviceData);
  };

  return {
    createGP51Device,
    checkDeviceAvailability,
    validateDeviceData,
    isCreating,
    isCheckingDevice
  };
};
