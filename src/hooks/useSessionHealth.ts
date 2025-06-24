
import { useState, useEffect } from 'react';
import { sessionHealthMonitor, SessionHealth } from '@/services/gp51/sessionHealthMonitor';

export const useSessionHealth = (autoStart: boolean = true) => {
  const [health, setHealth] = useState<SessionHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeHealthMonitoring = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Subscribe to health updates
        unsubscribe = sessionHealthMonitor.subscribe((healthData) => {
          setHealth(healthData);
          setIsLoading(false);
        });

        // Start monitoring if requested
        if (autoStart) {
          sessionHealthMonitor.startMonitoring(5); // Check every 5 minutes
        }

        // Get current health data
        const currentHealth = sessionHealthMonitor.getCurrentHealth();
        if (currentHealth) {
          setHealth(currentHealth);
          setIsLoading(false);
        } else {
          // Trigger initial health check
          await sessionHealthMonitor.checkSessionHealth();
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize health monitoring');
        setIsLoading(false);
      }
    };

    initializeHealthMonitoring();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [autoStart]);

  const refreshHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await sessionHealthMonitor.checkSessionHealth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSessionRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await sessionHealthMonitor.triggerSessionRefresh();
      
      if (!result.success) {
        setError(result.error || 'Session refresh failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Session refresh failed');
    } finally {
      setIsLoading(false);
    }
  };

  const healthStatus = sessionHealthMonitor.getHealthStatus();

  return {
    health,
    healthStatus,
    isLoading,
    error,
    refreshHealth,
    triggerSessionRefresh,
    startMonitoring: () => sessionHealthMonitor.startMonitoring(),
    stopMonitoring: () => sessionHealthMonitor.stopMonitoring()
  };
};
