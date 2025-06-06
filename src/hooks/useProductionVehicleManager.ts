
import { useState, useCallback } from 'react';
import { ProductionVehicleService, ProductionVehicleCreationRequest, ProductionVehicleCreationResult } from '@/services/productionVehicleService';
import { GP51ProductionService } from '@/services/gp51ProductionService';
import { EnhancedSessionManager } from '@/services/enhancedSessionManager';
import { useToast } from '@/hooks/use-toast';

export const useProductionVehicleManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const { toast } = useToast();

  const createProductionVehicle = useCallback(async (
    request: ProductionVehicleCreationRequest
  ): Promise<ProductionVehicleCreationResult> => {
    setIsCreating(true);
    
    try {
      console.log('Starting production vehicle creation...');
      
      const result = await ProductionVehicleService.createVehicleWithProductionChecks(request);
      
      if (result.success && result.isProductionReady) {
        toast({
          title: "Production Vehicle Created",
          description: `Vehicle ${request.deviceName} is ready for production deployment`,
          variant: "default",
        });
      } else if (result.success && !result.isProductionReady) {
        toast({
          title: "Vehicle Created with Warnings",
          description: `Vehicle ${request.deviceName} was created but requires attention before production`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Vehicle Creation Failed",
          description: result.errors.join(', '),
          variant: "destructive",
        });
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Production vehicle creation error:', error);
      
      toast({
        title: "Creation Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return {
        success: false,
        errors: [errorMessage],
        warnings: [],
        isProductionReady: false
      };
    } finally {
      setIsCreating(false);
    }
  }, [toast]);

  const performBulkHealthCheck = useCallback(async (deviceIds: string[]) => {
    setIsHealthChecking(true);
    
    try {
      console.log(`Performing bulk health check for ${deviceIds.length} devices...`);
      
      const healthReport = await ProductionVehicleService.performBulkProductionHealthCheck(deviceIds);
      
      toast({
        title: "Health Check Complete",
        description: `${healthReport.productionReady}/${healthReport.totalDevices} devices are production ready`,
        variant: healthReport.productionReady === healthReport.totalDevices ? "default" : "destructive",
      });
      
      return healthReport;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      console.error('Bulk health check error:', error);
      
      toast({
        title: "Health Check Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsHealthChecking(false);
    }
  }, [toast]);

  const validateSessionHealth = useCallback(async () => {
    try {
      const sessionValidation = await EnhancedSessionManager.validateGP51Session(true);
      
      if (!sessionValidation.isValid) {
        toast({
          title: "Session Issue",
          description: sessionValidation.error || 'Session validation failed',
          variant: "destructive",
        });
        return false;
      }
      
      if (sessionValidation.needsRotation) {
        toast({
          title: "Security Recommendation",
          description: "Consider refreshing your GP51 session for optimal security",
          variant: "default",
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }, [toast]);

  const performDeviceHandshake = useCallback(async (deviceId: string) => {
    try {
      const sessionValidation = await EnhancedSessionManager.validateGP51Session();
      if (!sessionValidation.isValid) {
        throw new Error('Invalid GP51 session');
      }

      const handshakeResult = await GP51ProductionService.performRealDeviceHandshake(
        deviceId,
        sessionValidation.username || ''
      );
      
      if (handshakeResult.success) {
        toast({
          title: "Device Handshake Successful",
          description: `Device ${deviceId} is ${handshakeResult.deviceStatus}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Device Handshake Failed",
          description: handshakeResult.error || 'Handshake failed',
          variant: "destructive",
        });
      }
      
      return handshakeResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Handshake error';
      console.error('Device handshake error:', error);
      
      toast({
        title: "Handshake Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return {
        success: false,
        deviceStatus: 'error' as const,
        error: errorMessage
      };
    }
  }, [toast]);

  const startDeviceMonitoring = useCallback(async (deviceId: string) => {
    try {
      await GP51ProductionService.startDeviceHealthMonitoring(deviceId);
      
      toast({
        title: "Monitoring Started",
        description: `Real-time monitoring enabled for device ${deviceId}`,
        variant: "default",
      });
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Monitoring start failed';
      console.error('Device monitoring error:', error);
      
      toast({
        title: "Monitoring Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  const stopDeviceMonitoring = useCallback((deviceId: string) => {
    try {
      GP51ProductionService.stopDeviceHealthMonitoring(deviceId);
      
      toast({
        title: "Monitoring Stopped",
        description: `Real-time monitoring disabled for device ${deviceId}`,
        variant: "default",
      });
      
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Monitoring stop failed';
      console.error('Stop monitoring error:', error);
      
      toast({
        title: "Stop Monitoring Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  return {
    isCreating,
    isHealthChecking,
    createProductionVehicle,
    performBulkHealthCheck,
    validateSessionHealth,
    performDeviceHandshake,
    startDeviceMonitoring,
    stopDeviceMonitoring
  };
};
