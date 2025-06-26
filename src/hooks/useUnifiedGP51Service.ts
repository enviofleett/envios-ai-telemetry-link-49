
import { useState, useEffect, useCallback } from 'react';
import { unifiedGP51Service, type GP51Session, type GP51HealthStatus } from '@/services/gp51/UnifiedGP51Service';
import { useToast } from '@/hooks/use-toast';

export interface UseUnifiedGP51ServiceReturn {
  session: GP51Session | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  health: GP51HealthStatus | null;
  authenticate: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshHealth: () => Promise<void>;
  clearError: () => void;
}

export const useUnifiedGP51Service = (): UseUnifiedGP51ServiceReturn => {
  const [session, setSession] = useState<GP51Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<GP51HealthStatus | null>(null);
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const authenticate = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await unifiedGP51Service.authenticate(username, password);
      
      if (result.status === 0) {
        setSession(unifiedGP51Service.session);
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${username}`,
        });
        return true;
      } else {
        const errorMessage = result.cause || 'Authentication failed';
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

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await unifiedGP51Service.logout();
      setSession(null);
      setHealth(null);
      toast({
        title: "Logged Out",
        description: "Successfully logged out from GP51",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout error';
      setError(errorMessage);
      toast({
        title: "Logout Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const refreshHealth = useCallback(async (): Promise<void> => {
    try {
      const healthStatus = await unifiedGP51Service.getConnectionHealth();
      setHealth(healthStatus);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      setError(errorMessage);
    }
  }, []);

  useEffect(() => {
    setSession(unifiedGP51Service.session);
    if (unifiedGP51Service.isConnected) {
      refreshHealth();
    }
  }, [refreshHealth]);

  return {
    session,
    isConnected: unifiedGP51Service.isConnected,
    isLoading,
    error,
    health,
    authenticate,
    logout,
    refreshHealth,
    clearError,
  };
};
