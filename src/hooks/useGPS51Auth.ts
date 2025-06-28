
import { useState, useCallback, useEffect } from 'react';
import { gps51AuthService } from '@/services/gp51/GPS51AuthService';
import { useToast } from '@/hooks/use-toast';

export interface GPS51AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  username: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'unknown';
}

export const useGPS51Auth = () => {
  const [authState, setAuthState] = useState<GPS51AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null,
    username: null,
    connectionStatus: 'unknown'
  });
  
  const { toast } = useToast();

  const updateAuthState = useCallback(async () => {
    const connectionStatus = gps51AuthService.getConnectionStatus();
    const username = await gps51AuthService.getCurrentUser(); // Await the Promise
    
    setAuthState(prev => ({
      ...prev,
      connectionStatus,
      username, // Now it's a string, not a Promise
    }));
  }, []);

  const checkAuthStatus = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const isAuth = await gps51AuthService.isAuthenticated();
      const currentUser = await gps51AuthService.getCurrentUser();
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: isAuth,
        username: currentUser,
        connectionStatus: gps51AuthService.getConnectionStatus(),
        isLoading: false
      }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
        isLoading: false,
        connectionStatus: 'disconnected'
      }));
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await gps51AuthService.login(username, password);
      
      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          username: result.username || username,
          connectionStatus: 'connected',
          isLoading: false,
          error: null
        }));
        
        toast({
          title: "Login Successful",
          description: `Connected to GPS51 as ${result.username || username}`,
        });
        
        return { success: true };
      } else {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          error: result.error || 'Login failed',
          isLoading: false,
          connectionStatus: 'disconnected'
        }));
        
        toast({
          title: "Login Failed",
          description: result.error || 'Invalid credentials',
          variant: "destructive",
        });
        
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        error: errorMessage,
        isLoading: false,
        connectionStatus: 'disconnected'
      }));
      
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await gps51AuthService.logout();
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        username: null,
        connectionStatus: 'disconnected'
      });
      
      toast({
        title: "Logged Out",
        description: "Successfully disconnected from GPS51",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      
      setAuthState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));
      
      toast({
        title: "Logout Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const refreshSession = useCallback(async () => {
    try {
      await gps51AuthService.refreshSession();
      await checkAuthStatus();
    } catch (error) {
      console.error('Session refresh failed:', error);
    }
  }, [checkAuthStatus]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Update connection status periodically
  useEffect(() => {
    const interval = setInterval(updateAuthState, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [updateAuthState]);

  return {
    ...authState,
    login,
    logout,
    refreshSession,
    checkAuthStatus,
    clearError
  };
};
