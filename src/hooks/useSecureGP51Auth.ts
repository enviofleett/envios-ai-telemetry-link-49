
import { useState, useEffect, useCallback } from 'react';
import { secureGP51AuthService } from '@/services/gp51/SecureGP51AuthService';
import { useToast } from '@/hooks/use-toast';

export interface SecureGP51AuthHook {
  isAuthenticated: boolean;
  username?: string;
  apiUrl?: string;
  lastValidated?: Date;
  isLoading: boolean;
  error: string | null;
  authenticate: (username: string, password: string, apiUrl?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
}

export const useSecureGP51Auth = (): SecureGP51AuthHook => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    username: undefined as string | undefined,
    apiUrl: undefined as string | undefined,
    lastValidated: undefined as Date | undefined,
    isLoading: true,
    error: null as string | null,
  });
  
  const { toast } = useToast();

  const refreshStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const status = await secureGP51AuthService.getAuthStatus();
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: status.isAuthenticated,
        username: status.username,
        apiUrl: status.apiUrl,
        lastValidated: status.lastValidated,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check status';
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const authenticate = useCallback(async (
    username: string, 
    password: string, 
    apiUrl?: string
  ): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await secureGP51AuthService.authenticate(username, password, apiUrl);
      
      if (result.success) {
        await refreshStatus();
        toast({
          title: "Authentication Successful",
          description: `Connected to GP51 as ${username}`,
        });
        return true;
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: result.error || 'Authentication failed'
        }));
        toast({
          title: "Authentication Failed",
          description: result.error || 'Invalid credentials',
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  }, [refreshStatus, toast]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      await secureGP51AuthService.logout();
      await refreshStatus();
      toast({
        title: "Logged Out",
        description: "Successfully disconnected from GP51",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setAuthState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      toast({
        title: "Logout Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [refreshStatus, toast]);

  const testConnection = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const credentials = await secureGP51AuthService.getSecureCredentials();
      if (!credentials) {
        return { success: false, error: 'No credentials found' };
      }

      // Test using the consolidated service
      const { consolidatedGP51Service } = await import('@/services/gp51/ConsolidatedGP51Service');
      return await consolidatedGP51Service.testConnection();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }, []);

  return {
    ...authState,
    authenticate,
    logout,
    refreshStatus,
    testConnection,
  };
};
