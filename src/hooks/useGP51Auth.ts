
import { useState, useEffect, useCallback } from 'react';
import { gps51AuthService, type AuthResult } from '@/services/gp51/Gps51AuthService';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  isLoading: boolean;
}

export const useGP51Auth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false
  });
  const { toast } = useToast();

  const updateAuthState = useCallback(() => {
    const status = gps51AuthService.getAuthStatus();
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: status.isAuthenticated,
      username: status.username,
      tokenExpiresAt: status.tokenExpiresAt
    }));
  }, []);

  useEffect(() => {
    updateAuthState();
    
    // Check auth status periodically
    const interval = setInterval(updateAuthState, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [updateAuthState]);

  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await gps51AuthService.login(username, password);
      
      if (result.success) {
        updateAuthState();
        toast({
          title: "Login Successful",
          description: `Connected to GP51 as ${username}`,
        });
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Unable to connect to GP51",
          variant: "destructive"
        });
      }
      
      return result;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [updateAuthState, toast]);

  const logout = useCallback(async (): Promise<AuthResult> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await gps51AuthService.logout();
      updateAuthState();
      
      if (result.success) {
        toast({
          title: "Logged Out",
          description: "Disconnected from GP51",
        });
      }
      
      return result;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [updateAuthState, toast]);

  const getToken = useCallback(async (): Promise<string | null> => {
    return await gps51AuthService.getToken();
  }, []);

  const healthCheck = useCallback(async (): Promise<boolean> => {
    const result = await gps51AuthService.healthCheck();
    updateAuthState(); // Update state after health check
    return result;
  }, [updateAuthState]);

  return {
    ...authState,
    login,
    logout,
    getToken,
    healthCheck
  };
};
