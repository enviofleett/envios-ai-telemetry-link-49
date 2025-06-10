
import { useState, useEffect } from 'react';
import { gp51StatusCoordinator, type GP51StatusState } from '@/services/gp51/statusCoordinator';
import { gp51SessionManager } from '@/services/gp51/sessionManager';

// Extended health status that includes connection status properties
interface ConnectionHealthStatus {
  status: 'connected' | 'disconnected' | 'auth_error' | 'degraded' | 'connecting' | 'saving';
  isConnected: boolean;
  lastSuccessfulSave?: Date;
  lastMonitorCheck?: Date;
  lastCheck?: Date; // Added for compatibility
  currentOperation?: string;
  latency?: number;
  errorMessage?: string;
  errorSource?: 'save' | 'monitor';
  username?: string;
  shouldShowError: boolean;
  expiresAt?: Date; // Added for compatibility
  consecutiveFailures?: number; // Added for compatibility
}

export const useGP51ConnectionHealth = () => {
  const [status, setStatus] = useState<ConnectionHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to coordinated status updates
    const unsubscribe = gp51StatusCoordinator.subscribeToStatus((coordinated: GP51StatusState) => {
      // Convert coordinated status to connection health status
      let connectionStatus: ConnectionHealthStatus['status'];
      
      if (coordinated.currentOperation === 'saving') {
        connectionStatus = 'saving';
      } else if (coordinated.isConnected) {
        connectionStatus = 'connected';
      } else if (coordinated.errorSource === 'save') {
        connectionStatus = 'auth_error';
      } else {
        connectionStatus = 'disconnected';
      }

      const healthStatus: ConnectionHealthStatus = {
        status: connectionStatus,
        isConnected: coordinated.isConnected,
        lastSuccessfulSave: coordinated.lastSuccessfulSave,
        lastMonitorCheck: coordinated.lastMonitorCheck,
        lastCheck: coordinated.lastMonitorCheck || new Date(), // Use lastMonitorCheck or current time
        currentOperation: coordinated.currentOperation,
        errorMessage: coordinated.errorMessage,
        errorSource: coordinated.errorSource,
        username: coordinated.username,
        shouldShowError: gp51StatusCoordinator.shouldShowError(),
        expiresAt: undefined, // Will be populated by session validation if needed
        consecutiveFailures: 0 // Default value for compatibility
      };
      
      setStatus(healthStatus);
    });

    return unsubscribe;
  }, []);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const startTime = Date.now();
      
      // Use session manager to test connection
      const result = await gp51SessionManager.testConnection();
      const latency = Date.now() - startTime;
      
      // Report results to status coordinator
      gp51StatusCoordinator.reportMonitorStatus(
        result.success, 
        result.error
      );
      
      // Update status with latency
      setStatus(prev => prev ? { ...prev, latency } : null);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      gp51StatusCoordinator.reportMonitorStatus(
        false, 
        error instanceof Error ? error.message : 'Health check failed'
      );
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
      await performHealthCheck();
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      gp51StatusCoordinator.reportMonitorStatus(
        false,
        error instanceof Error ? error.message : 'Reconnection failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    isLoading,
    performHealthCheck,
    attemptReconnection,
    startMonitoring: () => {
      // Monitoring is now handled by the status coordinator
      console.log('🔄 Monitoring managed by status coordinator');
    },
    stopMonitoring: () => {
      // Monitoring is now handled by the status coordinator
      console.log('⏹️ Monitoring managed by status coordinator');
    },
  };
};
