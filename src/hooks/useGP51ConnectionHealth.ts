
import { useState, useEffect } from 'react';
import { gp51ConnectionHealthService, ConnectionHealthStatus, HealthMetric } from '@/services/gp51ConnectionHealthService';
import { useToast } from '@/hooks/use-toast';

export const useGP51ConnectionHealth = (autoStart: boolean = true) => {
  const [status, setStatus] = useState<ConnectionHealthStatus | null>(null);
  const [healthHistory, setHealthHistory] = useState<HealthMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    const unsubscribe = gp51ConnectionHealthService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubscribe();
      if (autoStart) {
        gp51ConnectionHealthService.stopMonitoring();
      }
    };
  }, [autoStart]);

  const startMonitoring = (intervalMs?: number) => {
    gp51ConnectionHealthService.startMonitoring(intervalMs);
  };

  const stopMonitoring = () => {
    gp51ConnectionHealthService.stopMonitoring();
  };

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      await gp51ConnectionHealthService.performHealthCheck();
    } catch (error) {
      toast({
        title: "Health Check Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const attemptReconnection = async () => {
    setIsLoading(true);
    try {
      const result = await gp51ConnectionHealthService.attemptReconnection();
      toast({
        title: result.success ? "Reconnection Successful" : "Reconnection Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const loadHealthHistory = async (limit?: number) => {
    try {
      const history = await gp51ConnectionHealthService.getHealthHistory(limit);
      setHealthHistory(history);
    } catch (error) {
      console.error('Failed to load health history:', error);
    }
  };

  return {
    status,
    healthHistory,
    isLoading,
    startMonitoring,
    stopMonitoring,
    performHealthCheck,
    attemptReconnection,
    loadHealthHistory
  };
};
