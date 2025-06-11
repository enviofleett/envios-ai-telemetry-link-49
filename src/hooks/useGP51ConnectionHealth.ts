
import { useState, useEffect } from 'react';
import { gp51SessionValidator } from '@/services/vehiclePosition/sessionValidator';
import { GP51RealConnectionTester } from '@/services/gp51/realConnectionTester';

// Enhanced health status that shows real connection state
interface ConnectionHealthStatus {
  status: 'connected' | 'disconnected' | 'auth_error' | 'degraded' | 'connecting';
  isConnected: boolean;
  isReallyConnected: boolean; // NEW: Actual API connectivity
  lastSuccessfulPing?: Date;
  lastCheck?: Date;
  currentOperation?: string;
  latency?: number;
  errorMessage?: string;
  username?: string;
  shouldShowError: boolean;
  expiresAt?: Date;
  consecutiveFailures?: number;
  apiReachable?: boolean;
  dataFlowing?: boolean;
  deviceCount?: number;
}

export const useGP51ConnectionHealth = () => {
  const [status, setStatus] = useState<ConnectionHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const startTime = Date.now();
      
      // Use comprehensive connection testing
      const sessionResult = await gp51SessionValidator.testConnection();
      const connectionHealth = await GP51RealConnectionTester.testRealConnection();
      const latency = Date.now() - startTime;
      
      // Determine status based on real connectivity
      let connectionStatus: ConnectionHealthStatus['status'];
      if (connectionHealth.isConnected && connectionHealth.dataFlowing) {
        connectionStatus = 'connected';
      } else if (connectionHealth.sessionValid && connectionHealth.apiReachable) {
        connectionStatus = 'degraded';
      } else if (!connectionHealth.sessionValid) {
        connectionStatus = 'auth_error';
      } else {
        connectionStatus = 'disconnected';
      }

      const healthStatus: ConnectionHealthStatus = {
        status: connectionStatus,
        isConnected: sessionResult.success || false,
        isReallyConnected: connectionHealth.isConnected && connectionHealth.dataFlowing,
        lastSuccessfulPing: connectionHealth.lastSuccessfulPing,
        lastCheck: new Date(),
        latency,
        errorMessage: connectionHealth.errorMessage || sessionResult.error,
        username: undefined, // Would need to get from session
        shouldShowError: !connectionHealth.isConnected || !connectionHealth.dataFlowing,
        expiresAt: undefined,
        consecutiveFailures: connectionHealth.isConnected ? 0 : 1,
        apiReachable: connectionHealth.apiReachable,
        dataFlowing: connectionHealth.dataFlowing,
        deviceCount: connectionHealth.deviceCount
      };
      
      setStatus(healthStatus);
    } catch (error) {
      console.error('❌ Health check failed:', error);
      setStatus(prev => prev ? {
        ...prev,
        status: 'disconnected',
        isReallyConnected: false,
        errorMessage: error instanceof Error ? error.message : 'Health check failed',
        shouldShowError: true
      } : null);
    } finally {
      setIsLoading(false);
    }
  };

  const attemptReconnection = async () => {
    setIsLoading(true);
    try {
      setStatus(prev => prev ? { ...prev, status: 'connecting' } : null);
      
      // Clear cache and force fresh validation
      gp51SessionValidator.forceReset();
      
      // Perform fresh health check
      await performHealthCheck();
    } catch (error) {
      console.error('❌ Reconnection failed:', error);
      setStatus(prev => prev ? {
        ...prev,
        status: 'disconnected',
        isReallyConnected: false,
        errorMessage: error instanceof Error ? error.message : 'Reconnection failed'
      } : null);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-check on mount and periodically
  useEffect(() => {
    performHealthCheck();
    
    const interval = setInterval(() => {
      performHealthCheck();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    isLoading,
    performHealthCheck,
    attemptReconnection,
    startMonitoring: () => {
      console.log('🔄 Monitoring is automatic every 60 seconds');
    },
    stopMonitoring: () => {
      console.log('⏹️ Monitoring continues in background');
    },
  };
};
