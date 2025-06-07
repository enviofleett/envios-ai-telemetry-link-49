
import { useState, useEffect } from 'react';
import { realtimeMonitoringService, SystemHealthSummary } from '@/services/reliability/RealtimeMonitoringService';

export const useRealtimeMonitoring = (autoStart: boolean = true) => {
  const [healthSummary, setHealthSummary] = useState<SystemHealthSummary | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    const unsubscribe = realtimeMonitoringService.subscribe((summary) => {
      setHealthSummary(summary);
    });

    return () => {
      unsubscribe();
      if (autoStart) {
        realtimeMonitoringService.stopMonitoring();
      }
    };
  }, [autoStart]);

  const startMonitoring = (intervalMs?: number) => {
    realtimeMonitoringService.startMonitoring(intervalMs);
    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    realtimeMonitoringService.stopMonitoring();
    setIsMonitoring(false);
  };

  const acknowledgeAlert = (alertId: string) => {
    return realtimeMonitoringService.acknowledgeAlert(alertId);
  };

  const resolveAlert = (alertId: string) => {
    return realtimeMonitoringService.resolveAlert(alertId);
  };

  const triggerHealthCheck = async () => {
    return await realtimeMonitoringService.triggerHealthCheck();
  };

  const emergencyReset = () => {
    realtimeMonitoringService.emergencyReset();
  };

  return {
    healthSummary,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    acknowledgeAlert,
    resolveAlert,
    triggerHealthCheck,
    emergencyReset
  };
};
