
import { useState, useEffect } from 'react';
import { healthMonitoringService } from '@/services/gp51/healthMonitoringService';

interface HealthMetrics {
  isHealthy: boolean;
  lastCheck: Date;
  responseTime: number;
  successRate: number;
  errorCount: number;
  totalRequests: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
}

export const useGP51Health = () => {
  const [metrics, setMetrics] = useState<HealthMetrics>(() => 
    healthMonitoringService.getHealthMetrics()
  );

  useEffect(() => {
    const unsubscribe = healthMonitoringService.subscribe(setMetrics);
    return unsubscribe;
  }, []);

  return {
    health: metrics,
    refreshHealth: () => setMetrics(healthMonitoringService.getHealthMetrics()),
    clearHistory: () => healthMonitoringService.clearHistory()
  };
};
