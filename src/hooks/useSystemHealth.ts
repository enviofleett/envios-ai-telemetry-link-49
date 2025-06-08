
import { useState, useEffect } from 'react';
import { systemHealthMonitor } from '@/services/systemHealthMonitor';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: number | string;
  threshold?: number;
  lastChecked: Date;
  message?: string;
}

interface HealthAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface SystemHealthStatus {
  overall: 'healthy' | 'warning' | 'critical';
  metrics: HealthMetric[];
  alerts: HealthAlert[];
  uptime: number;
  responseTime: number;
}

export const useSystemHealth = () => {
  const [healthStatus, setHealthStatus] = useState<SystemHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = systemHealthMonitor.subscribe((status) => {
      setHealthStatus(status);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const resolveAlert = (alertId: string) => {
    systemHealthMonitor.resolveAlert(alertId);
  };

  const clearResolvedAlerts = () => {
    systemHealthMonitor.clearResolvedAlerts();
  };

  return {
    healthStatus,
    isLoading,
    resolveAlert,
    clearResolvedAlerts
  };
};
