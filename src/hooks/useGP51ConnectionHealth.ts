
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
      let connectionStatus: 'connected' | 'disconnected' | 'auth_error' | 'degraded' | 'connecting';
      let errorMessage: string | undefined;

      if (health.isAuthError) {
        connectionStatus = 'auth_error';
        errorMessage = 'Authentication required - please refresh the page and log in';
      } else if (health.isValid) {
        connectionStatus = health.needsRefresh ? 'degraded' : 'connected';
      } else {
        connectionStatus = 'disconnected';
        errorMessage = health.consecutiveFailures > 0 
          ? `Connection failed (${health.consecutiveFailures} consecutive failures)`
          : undefined;
      }

      const connectionStatusObj: ConnectionHealthStatus = {
        ...health,
        status: connectionStatus,
        latency: undefined, // Will be populated during health checks
        errorMessage
      };
      setStatus(connectionStatusObj);
    });

    // Get current health
    const currentHealth = sessionHealthMonitor.getHealthStatus();
    if (currentHealth) {
      let connectionStatus: 'connected' | 'disconnected' | 'auth_error' | 'degraded' | 'connecting';
      let errorMessage: string | undefined;

      if (currentHealth.isAuthError) {
        connectionStatus = 'auth_error';
        errorMessage = 'Authentication required - please refresh the page and log in';
      } else if (currentHealth.isValid) {
        connectionStatus = currentHealth.needsRefresh ? 'degraded' : 'connected';
      } else {
        connectionStatus = 'disconnected';
        errorMessage = currentHealth.consecutiveFailures > 0 
          ? `Connection failed (${currentHealth.consecutiveFailures} consecutive failures)`
          : undefined;
      }

      const connectionStatusObj: ConnectionHealthStatus = {
        ...currentHealth,
        status: connectionStatus,
        latency: undefined,
        errorMessage
      };
      setStatus(connectionStatusObj);
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
    startMonitoring: () => sessionHealthMonitor.startMonitoring(),
    stopMonitoring: () => sessionHealthMonitor.stopMonitoring(),
  };
};
