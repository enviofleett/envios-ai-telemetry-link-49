
import { useState } from 'react';
import { GP51DeviceActivationService, type GP51DeviceActivationRequest, type GP51DeviceActivationResult } from '@/services/gp51DeviceActivationService';
import { useToast } from '@/hooks/use-toast';

export const useDeviceActivation = () => {
  const [isActivating, setIsActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState<'idle' | 'activating' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const activateDevice = async (request: GP51DeviceActivationRequest): Promise<GP51DeviceActivationResult> => {
    setIsActivating(true);
    setActivationStatus('activating');

    try {
      const result = await GP51DeviceActivationService.activateDevice(request);

      if (result.success) {
        setActivationStatus('success');
        toast({
          title: "Device Activated",
          description: `Device ${request.deviceId} has been successfully activated on GP51`,
        });
      } else {
        setActivationStatus('error');
        toast({
          title: "Activation Failed",
          description: result.error || "Failed to activate device",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      setActivationStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Activation Error",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage,
        activationStatus: 'error'
      };
    } finally {
      setIsActivating(false);
    }
  };

  const checkActivationStatus = async (deviceId: string) => {
    try {
      return await GP51DeviceActivationService.checkDeviceActivationStatus(deviceId);
    } catch (error) {
      toast({
        title: "Status Check Failed",
        description: "Failed to check device activation status",
        variant: "destructive",
      });
      return {
        isActivated: false,
        status: 'error' as const
      };
    }
  };

  const bulkActivateDevices = async (deviceIds: string[], years: number, adminUserId: string) => {
    setIsActivating(true);
    setActivationStatus('activating');

    try {
      const result = await GP51DeviceActivationService.bulkActivateDevices(deviceIds, years, adminUserId);
      
      if (result.successful.length > 0) {
        setActivationStatus('success');
        toast({
          title: "Bulk Activation Complete",
          description: `${result.successful.length} devices activated successfully. ${result.failed.length} failed.`,
        });
      } else {
        setActivationStatus('error');
        toast({
          title: "Bulk Activation Failed",
          description: "No devices were successfully activated",
          variant: "destructive",
        });
      }

      return result;
    } catch (error) {
      setActivationStatus('error');
      toast({
        title: "Bulk Activation Error",
        description: "Failed to activate devices",
        variant: "destructive",
      });
      return { successful: [], failed: [] };
    } finally {
      setIsActivating(false);
    }
  };

  return {
    activateDevice,
    checkActivationStatus,
    bulkActivateDevices,
    isActivating,
    activationStatus
  };
};
