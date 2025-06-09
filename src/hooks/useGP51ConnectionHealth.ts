
import { useState, useEffect } from 'react';
import { sessionHealthMonitor, SessionHealth } from '@/services/gp51/sessionHealthMonitor';

export const useGP51ConnectionHealth = () => {
  const [status, setStatus] = useState<SessionHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to health updates
    const unsubscribe = sessionHealthMonitor.onHealthUpdate((health) => {
      setStatus(health);
    });

    // Get current health
    const currentHealth = sessionHealthMonitor.getHealthStatus();
    if (currentHealth) {
      setStatus(currentHealth);
    }

    return unsubscribe;
  }, []);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      await sessionHealthMonitor.forceHealthCheck();
    } finally {
      setIsLoading(false);
    }
  };

  const startMonitoring = () => {
    sessionHealthMonitor.startMonitoring();
  };

  const stopMonitoring = () => {
    sessionHealthMonitor.stopMonitoring();
  };

  return {
    status,
    isLoading,
    performHealthCheck,
    startMonitoring,
    stopMonitoring,
  };
};
