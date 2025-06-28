
import { useState, useEffect, useCallback } from 'react';
import { gp51AuthStateManager } from '@/services/gp51/GP51AuthStateManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GP51AuthResult {
  success: boolean;
  error?: string;
  sessionId?: string;
  username?: string;
}

export const useGP51AuthConsolidated = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [authState, setAuthState] = useState(() => gp51AuthStateManager.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = gp51AuthStateManager.subscribe((state) => {
      console.log('🔄 [useGP51AuthConsolidated] Auth state updated:', state);
      setAuthState(state);
      setIsLoading(state.isAuthenticating);
      setError(state.error || null);
    });

    return unsubscribe;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    gp51AuthStateManager.clearError();
  }, []);

  const login = useCallback(async (
    username: string, 
    password: string
  ): Promise<GP51AuthResult> => {
    if (gp51AuthStateManager.isLocked()) {
      const message = 'Authentication already in progress';
      setError(message);
      return { success: false, error: message };
    }

    try {
      console.log('🔑 [useGP51AuthConsolidated] Starting GP51 authentication...');
      
      await gp51AuthStateManager.setAuthenticating(true);
      setIsLoading(true);
      setError(null);

      const { data, error: invokeError } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'authenticate-gp51',
          username,
          password,
          apiUrl: 'https://www.gps51.com'
        }
      });

      if (invokeError) {
        console.error('❌ [useGP51AuthConsolidated] Edge function error:', invokeError);
        const errorMessage = `Authentication failed: ${invokeError.message}`;
        
        await gp51AuthStateManager.setAuthenticated(false, { error: errorMessage });
        
        toast({
          title: "Authentication Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { success: false, error: errorMessage };
      }

      if (!data?.success) {
        console.error('❌ [useGP51AuthConsolidated] Authentication failed:', data?.error);
        const errorMessage = data?.error || 'Authentication failed';
        
        await gp51AuthStateManager.setAuthenticated(false, { error: errorMessage });
        
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        return { success: false, error: errorMessage };
      }

      console.log('✅ [useGP51AuthConsolidated] Authentication successful');
      
      // Set authenticated state with session details
      await gp51AuthStateManager.setAuthenticated(true, {
        username: data.username || username,
        sessionId: data.sessionId,
        tokenExpiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      toast({
        title: "Login Successful",
        description: `Connected to GP51 as ${data.username || username}`,
      });

      // Validate session after authentication
      setTimeout(async () => {
        console.log('🔍 [useGP51AuthConsolidated] Post-authentication session validation...');
        const validationResult = await gp51AuthStateManager.validateSession();
        if (!validationResult) {
          console.warn('⚠️ [useGP51AuthConsolidated] Session validation failed after authentication');
        }
      }, 6000); // Wait 6 seconds after the 5-second auth delay

      return {
        success: true,
        sessionId: data.sessionId,
        username: data.username || username
      };

    } catch (error) {
      console.error('❌ [useGP51AuthConsolidated] Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      await gp51AuthStateManager.setAuthenticated(false, { error: errorMessage });
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log('🚪 [useGP51AuthConsolidated] Logging out...');
      
      await gp51AuthStateManager.setAuthenticated(false);
      
      toast({
        title: "Logged Out",
        description: "Successfully disconnected from GP51",
      });
    } catch (error) {
      console.error('❌ [useGP51AuthConsolidated] Logout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      
      toast({
        title: "Logout Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const checkConnection = useCallback(async (): Promise<GP51AuthResult> => {
    if (gp51AuthStateManager.isLocked()) {
      return { success: false, error: 'Authentication in progress' };
    }

    return await gp51AuthStateManager.safeStatusCheck(async () => {
      try {
        console.log('🔍 [useGP51AuthConsolidated] Checking connection status...');
        
        const { data, error } = await supabase.functions.invoke('settings-management', {
          body: { action: 'get-gp51-status' }
        });

        if (error) {
          console.error('❌ [useGP51AuthConsolidated] Status check error:', error);
          return { success: false, error: error.message };
        }

        const isConnected = data?.connected || false;
        console.log(`📊 [useGP51AuthConsolidated] Connection status: ${isConnected ? 'Connected' : 'Disconnected'}`);

        return {
          success: isConnected,
          username: data?.username,
          error: isConnected ? undefined : 'Not connected to GP51'
        };
      } catch (error) {
        console.error('❌ [useGP51AuthConsolidated] Status check failed:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Connection check failed' 
        };
      }
    });
  }, []);

  return {
    ...authState,
    isLoading,
    error,
    login,
    logout,
    checkConnection,
    clearError,
  };
};
