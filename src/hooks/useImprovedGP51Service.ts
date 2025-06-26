
import { useState, useEffect, useCallback } from 'react';
import { improvedUnifiedGP51Service, GP51ConnectionConfig, GP51Session, GP51ServiceResult, GP51HealthStatus } from '@/services/gp51/improvedUnifiedGP51Service';
import { useToast } from '@/hooks/use-toast';

export interface UseImprovedGP51ServiceReturn {
  session: GP51Session | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  healthStatus: GP51HealthStatus | null;
  authenticate: (config: GP51ConnectionConfig) => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  getConnectionHealth: () => Promise<GP51HealthStatus>;
  clearError: () => void;
  retryConnection: () => Promise<boolean>;
}

export const useImprovedGP51Service = (): UseImprovedGP51ServiceReturn => {
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<GP51HealthStatus | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to session changes
    const unsubscribe = improvedUnifiedGP51Service.subscribeToSession((newSession) => {
      setSession(newSession);
    });

    return unsubscribe;
  }, []);

  // Automatically update health status when session changes
  useEffect(() => {
    if (session) {
      getConnectionHealth().catch(console.error);
    }
  }, [session]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (config: GP51ConnectionConfig): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await improvedUnifiedGP51Service.authenticate(config);
      
      if (result.success) {
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${config.username}`,
        });
        return true;
      } else {
        const errorMessage = result.error || 'Authentication failed';
        setError(errorMessage);
        
        if (result.requiresReauth) {
          toast({
            title: "Re-authentication Required",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Authentication Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication error';
      setError(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await improvedUnifiedGP51Service.testConnection();
      
      if (result.success) {
        if (result.healthStatus) {
          setHealthStatus(result.healthStatus);
        }
        
        toast({
          title: "Connection Test Successful",
          description: "GP51 connection is working properly",
        });
        return true;
      } else {
        setError(result.error || 'Connection test failed');
        
        if (result.requiresReauth) {
          toast({
            title: "Re-authentication Required",
            description: result.error || 'Session expired, please re-authenticate',
            variant: "destructive",
          });
        } else {
          toast({
            title: "Connection Test Failed",
            description: result.error || 'Connection test failed',
            variant: "destructive",
          });
        }
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test error';
      setError(errorMessage);
      toast({
        title: "Connection Test Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await improvedUnifiedGP51Service.refreshSession();
      
      if (result.success) {
        if (result.requiresReauth) {
          toast({
            title: "Re-authentication Required",
            description: "Session refresh initiated. Please re-authenticate with your credentials.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Session Refreshed",
            description: "GP51 session has been refreshed successfully",
          });
        }
        return true;
      } else {
        setError(result.error || 'Session refresh failed');
        toast({
          title: "Session Refresh Failed",
          description: result.error || 'Session refresh failed',
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Session refresh error';
      setError(errorMessage);
      toast({
        title: "Session Refresh Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const disconnect = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await improvedUnifiedGP51Service.disconnect();
      setHealthStatus(null);
      
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from GP51",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Disconnect error';
      setError(errorMessage);
      toast({
        title: "Disconnect Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getConnectionHealth = useCallback(async (): Promise<GP51HealthStatus> => {
    try {
      const health = await improvedUnifiedGP51Service.getConnectionHealth();
      setHealthStatus(health);
      return health;
    } catch (error) {
      console.error('❌ Failed to get connection health:', error);
      throw error;
    }
  }, []);

  const retryConnection = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First test the connection
      const testResult = await testConnection();
      
      if (!testResult) {
        // If test fails, try to refresh session
        const refreshResult = await refreshSession();
        
        if (refreshResult) {
          // After refresh, test again
          return await testConnection();
        }
      }
      
      return testResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Retry failed';
      setError(errorMessage);
      toast({
        title: "Retry Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [testConnection, refreshSession, toast]);

  return {
    session,
    isConnected: improvedUnifiedGP51Service.isSessionValid(),
    isLoading,
    error,
    healthStatus,
    authenticate,
    testConnection,
    refreshSession,
    disconnect,
    getConnectionHealth,
    clearError,
    retryConnection,
  };
};
