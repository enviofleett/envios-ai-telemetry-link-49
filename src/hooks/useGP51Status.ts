
import { useState, useEffect } from 'react';
import { gp51SessionValidator } from '@/services/vehiclePosition/sessionValidator';
import { GP51SessionManager } from '@/services/gp51/sessionManager';

interface GP51Status {
  isConnected: boolean;
  isReallyConnected?: boolean;
  username?: string;
  lastSync?: string;
  errorMessage?: string;
  connectionHealth?: 'good' | 'poor' | 'disconnected';
}

export const useGP51Status = () => {
  const [status, setStatus] = useState<GP51Status>({
    isConnected: false,
    connectionHealth: 'disconnected'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check session validation with real connectivity test
      const sessionResult = await gp51SessionValidator.ensureValidSession();
      
      // Also check basic connection status
      const connectionResult = await GP51SessionManager.testConnection();
      
      setStatus({
        isConnected: sessionResult.valid && connectionResult.success,
        isReallyConnected: sessionResult.isReallyConnected,
        username: sessionResult.username,
        lastSync: sessionResult.valid ? new Date().toISOString() : undefined,
        errorMessage: sessionResult.error || connectionResult.error,
        connectionHealth: sessionResult.isReallyConnected ? 'good' : 
                        sessionResult.valid ? 'poor' : 'disconnected'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check GP51 status';
      setError(errorMessage);
      setStatus({
        isConnected: false,
        connectionHealth: 'disconnected',
        errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryConnection = async () => {
    // Clear cache and retry
    gp51SessionValidator.clearCache();
    await checkStatus();
  };

  useEffect(() => {
    checkStatus();
    
    // Check status every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    status,
    isLoading,
    error,
    checkStatus,
    retryConnection
  };
};
