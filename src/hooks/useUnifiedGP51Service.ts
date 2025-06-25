
import { useState, useEffect, useCallback } from 'react';
import { unifiedGP51Service, GP51ConnectionConfig, GP51Session, GP51ServiceResult } from '@/services/gp51/UnifiedGP51Service';
import { useToast } from '@/hooks/use-toast';

export interface UseUnifiedGP51ServiceReturn {
  session: GP51Session | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  authenticate: (config: GP51ConnectionConfig) => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  queryMonitorList: () => Promise<GP51ServiceResult>;
  queryLastPosition: (deviceIds?: string[]) => Promise<GP51ServiceResult>;
  refreshSession: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  getConnectionHealth: () => Promise<any>;
  clearError: () => void;
}

export const useUnifiedGP51Service = (): UseUnifiedGP51ServiceReturn => {
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to session changes
    const unsubscribe = unifiedGP51Service.subscribeToSession((newSession) => {
      setSession(newSession);
    });

    return unsubscribe;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (config: GP51ConnectionConfig): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedGP51Service.authenticate(config);
      
      if (result.success) {
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${config.username}`,
        });
        return true;
      } else {
        const errorMessage = result.error || 'Authentication failed';
        setError(errorMessage);
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
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
      const result = await unifiedGP51Service.testConnection();
      
      if (result.success) {
        toast({
          title: "Connection Test Successful",
          description: "GP51 connection is working properly",
        });
        return true;
      } else {
        setError(result.error || 'Connection test failed');
        toast({
          title: "Connection Test Failed",
          description: result.error || 'Connection test failed',
          variant: "destructive",
        });
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

  const queryMonitorList = useCallback(async (): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.queryMonitorList();
      
      if (!result.success) {
        setError(result.error || 'Monitor list query failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Monitor list query error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const queryLastPosition = useCallback(async (deviceIds?: string[]): Promise<GP51ServiceResult> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.queryLastPosition(deviceIds);
      
      if (!result.success) {
        setError(result.error || 'Position query failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Position query error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await unifiedGP51Service.refreshSession();
      
      if (result.success) {
        toast({
          title: "Session Refreshed",
          description: "GP51 session has been refreshed successfully",
        });
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
      await unifiedGP51Service.terminate();
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

  const getConnectionHealth = useCallback(async () => {
    try {
      return await unifiedGP51Service.getConnectionHealth();
    } catch (error) {
      console.error('❌ Failed to get connection health:', error);
      throw error;
    }
  }, []);

  return {
    session,
    isConnected: unifiedGP51Service.isSessionValid(),
    isLoading,
    error,
    authenticate,
    testConnection,
    queryMonitorList,
    queryLastPosition,
    refreshSession,
    disconnect,
    getConnectionHealth,
    clearError,
  };
};
