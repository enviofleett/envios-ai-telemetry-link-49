
import { useState, useEffect, useCallback } from 'react';
import { consolidatedGP51Service, GP51ConnectionConfig, GP51Session, GP51ServiceResult } from '@/services/gp51/ConsolidatedGP51Service';
import { useToast } from '@/hooks/use-toast';

export interface UseConsolidatedGP51ServiceReturn {
  session: GP51Session | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  authenticate: (config: GP51ConnectionConfig) => Promise<boolean>;
  testConnection: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

export const useConsolidatedGP51Service = (): UseConsolidatedGP51ServiceReturn => {
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to session changes
    const unsubscribe = consolidatedGP51Service.subscribeToSession((newSession) => {
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
      const result = await consolidatedGP51Service.authenticate(config);
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to GP51 as ${config.username}`,
        });
        return true;
      } else {
        const errorMessage = result.error || 'Authentication failed';
        setError(errorMessage);
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection error';
      setError(errorMessage);
      toast({
        title: "Connection Error",
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
      const result = await consolidatedGP51Service.testConnection();
      
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

  const refreshSession = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const result = await consolidatedGP51Service.refreshSession();
      
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
      await consolidatedGP51Service.terminate();
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

  return {
    session,
    isConnected: consolidatedGP51Service.isSessionValid(),
    isLoading,
    error,
    authenticate,
    testConnection,
    refreshSession,
    disconnect,
    clearError,
  };
};
