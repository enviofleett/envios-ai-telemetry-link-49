
import { useState, useEffect, useCallback } from 'react';
import { gps51AuthService, type AuthResult } from '@/services/gp51/Gps51AuthService';
import { useToast } from '@/hooks/use-toast';

interface AuthState {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean; // New state for token refresh
}

export const useGP51Auth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isRefreshing: false
  });
  const { toast } = useToast();

  const updateAuthState = useCallback(() => {
    const status = gps51AuthService.getAuthStatus();
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: status.isAuthenticated,
      username: status.username,
      tokenExpiresAt: status.tokenExpiresAt,
      isRefreshing: false // Reset refresh state when updating
    }));
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    console.log('🔍 useGP51Auth: Initializing hook and checking auth status...');
    updateAuthState();
    
    // Check auth status periodically and handle auto-refresh
    const interval = setInterval(async () => {
      console.log('🔄 useGP51Auth: Periodic auth status check...');
      
      const currentStatus = gps51AuthService.getAuthStatus();
      if (currentStatus.isAuthenticated) {
        try {
          // This will trigger auto-refresh if needed
          setAuthState(prev => ({ ...prev, isRefreshing: true }));
          await gps51AuthService.getToken();
          setAuthState(prev => ({ ...prev, isRefreshing: false }));
        } catch (error) {
          console.error('❌ Auto-refresh failed:', error);
          setAuthState(prev => ({ 
            ...prev, 
            isRefreshing: false,
            error: 'Auto-refresh failed - please re-login'
          }));
        }
      }
      
      updateAuthState();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [updateAuthState]);

  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    console.log(`🔐 useGP51Auth: Starting login process for user: ${username}`);
    
    setAuthState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      isRefreshing: false
    }));
    
    try {
      const result = await gps51AuthService.login(username, password);
      
      if (result.success) {
        console.log('✅ useGP51Auth: Login successful');
        updateAuthState();
        setAuthState(prev => ({ ...prev, error: null }));
        
        toast({
          title: "Login Successful",
          description: `Connected to GP51 as ${username}. Token will auto-refresh for 24 hours.`,
        });
      } else {
        console.error('❌ useGP51Auth: Login failed:', result.error);
        setAuthState(prev => ({ 
          ...prev, 
          error: result.error || "Unable to connect to GP51" 
        }));
        
        toast({
          title: "Login Failed",
          description: result.error || "Unable to connect to GP51",
          variant: "destructive"
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ useGP51Auth: Login exception:', error);
      
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage 
      }));
      
      toast({
        title: "Login Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [updateAuthState, toast]);

  const logout = useCallback(async (): Promise<AuthResult> => {
    console.log('👋 useGP51Auth: Starting logout process...');
    
    setAuthState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));
    
    try {
      const result = await gps51AuthService.logout();
      updateAuthState();
      
      if (result.success) {
        console.log('✅ useGP51Auth: Logout successful');
        setAuthState(prev => ({ ...prev, error: null }));
        
        toast({
          title: "Logged Out",
          description: "Disconnected from GP51",
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('❌ useGP51Auth: Logout exception:', error);
      
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage 
      }));
      
      return { success: false, error: errorMessage };
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [updateAuthState, toast]);

  const getToken = useCallback(async (): Promise<string | null> => {
    try {
      console.log('🎫 useGP51Auth: Getting authentication token...');
      setAuthState(prev => ({ ...prev, isRefreshing: true }));
      
      const token = await gps51AuthService.getToken();
      
      setAuthState(prev => ({ ...prev, isRefreshing: false }));
      return token;
    } catch (error) {
      console.error('❌ useGP51Auth: Failed to get token:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get authentication token';
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isRefreshing: false 
      }));
      return null;
    }
  }, []);

  const healthCheck = useCallback(async (): Promise<boolean> => {
    console.log('🏥 useGP51Auth: Performing health check...');
    
    setAuthState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null 
    }));
    
    try {
      const result = await gps51AuthService.healthCheck();
      updateAuthState();
      
      if (!result) {
        setAuthState(prev => ({ 
          ...prev, 
          error: "Health check failed - connection may be unstable" 
        }));
      } else {
        console.log('✅ useGP51Auth: Health check passed');
        setAuthState(prev => ({ ...prev, error: null }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Health check failed';
      console.error('❌ useGP51Auth: Health check exception:', error);
      
      setAuthState(prev => ({ 
        ...prev, 
        error: errorMessage 
      }));
      
      return false;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [updateAuthState]);

  return {
    ...authState,
    login,
    logout,
    getToken,
    healthCheck,
    clearError
  };
};
