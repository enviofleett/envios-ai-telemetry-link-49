
import { useState, useEffect } from 'react';
import { sessionHealthMonitor, SessionHealth } from '@/services/gp51/sessionHealthMonitor';
import { gp51SessionManager } from '@/services/gp51/sessionManager';

// Extended health status that includes connection status properties
interface ConnectionHealthStatus extends SessionHealth {
  status: 'connected' | 'disconnected' | 'auth_error' | 'degraded' | 'connecting';
  latency?: number;
  errorMessage?: string;
}

export const useGP51ConnectionHealth = () => {
  const [status, setStatus] = useState<ConnectionHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to health updates
    const unsubscribe = sessionHealthMonitor.onHealthUpdate((health) => {
      // Convert SessionHealth to ConnectionHealthStatus
      const connectionStatus: ConnectionHealthStatus = {
        ...health,
        status: health.isValid ? 'connected' : 'disconnected',
        latency: undefined, // Will be populated during health checks
        errorMessage: health.consecutiveFailures > 0 
          ? `Connection failed (${health.consecutiveFailures} consecutive failures)`
          : undefined
      };
      setStatus(connectionStatus);
    });

    // Get current health
    const currentHealth = sessionHealthMonitor.getHealthStatus();
    if (currentHealth) {
      const connectionStatus: ConnectionHealthStatus = {
        ...currentHealth,
        status: currentHealth.isValid ? 'connected' : 'disconnected',
        latency: undefined,
        errorMessage: currentHealth.consecutiveFailures > 0 
          ? `Connection failed (${currentHealth.consecutiveFailures} consecutive failures)`
          : undefined
      };
      setStatus(connectionStatus);
    }

    return unsubscribe;
  }, []);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const startTime = Date.now();
      await sessionHealthMonitor.forceHealthCheck();
      const latency = Date.now() - startTime;
      
      // Update status with latency
      setStatus(prev => prev ? { ...prev, latency } : null);
    } finally {
      setIsLoading(false);
    }
  };

  const attemptReconnection = async () => {
    setIsLoading(true);
    try {
      // Update status to connecting
      setStatus(prev => prev ? { ...prev, status: 'connecting' } : null);
      
      // Try to refresh the session
      await gp51SessionManager.refreshSession();
      // Force a health check after reconnection attempt
      await sessionHealthMonitor.forceHealthCheck();
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      setStatus(prev => prev ? { 
        ...prev, 
        status: 'auth_error',
        errorMessage: error instanceof Error ? error.message : 'Reconnection failed'
      } : null);
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
    attemptReconnection,
    startMonitoring,
    stopMonitoring,
  };
};
