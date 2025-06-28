
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { gp51AuthStateManager } from '@/services/gp51/GP51AuthStateManager';

export interface GP51AuthResult {
  success: boolean;
  error?: string;
}

interface GP51AuthState {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  isLoading: boolean;
  error: string | null;
  isCheckingStatus: boolean;
}

export const useGP51AuthConsolidated = () => {
  const [authState, setAuthState] = useState<GP51AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isCheckingStatus: true,
  });
  const { toast } = useToast();

  // Subscribe to centralized auth state
  useEffect(() => {
    const unsubscribe = gp51AuthStateManager.subscribe((centralState) => {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: centralState.isAuthenticated,
        username: centralState.username,
        tokenExpiresAt: centralState.tokenExpiresAt,
        isLoading: centralState.isAuthenticating,
        error: centralState.error || null,
        isCheckingStatus: false
      }));
    });

    return unsubscribe;
  }, []);

  const checkAuthStatus = useCallback(async () => {
    console.log('🔍 [GP51Auth] Checking GP51 authentication status...');
    
    // Don't check status if authentication is in progress
    if (gp51AuthStateManager.isLocked()) {
      console.log('🔒 [GP51Auth] Skipping status check - auth in progress');
      return;
    }

    setAuthState(prev => ({ ...prev, isCheckingStatus: true }));

    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (error) {
        console.error('❌ [GP51Auth] Status check error:', error);
        await gp51AuthStateManager.setAuthenticated(false, {
          error: 'Failed to check authentication status'
        });
        return;
      }

      const isAuthenticated = data.connected && !data.isExpired;
      console.log(`📊 [GP51Auth] Status: ${isAuthenticated ? 'Connected' : 'Disconnected'}`, {
        connected: data.connected,
        isExpired: data.isExpired,
        username: data.username,
        expiresAt: data.expiresAt
      });

      await gp51AuthStateManager.setAuthenticated(isAuthenticated, {
        username: data.username,
        tokenExpiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
      });

    } catch (error) {
      console.error('❌ [GP51Auth] Status check failed:', error);
      await gp51AuthStateManager.setAuthenticated(false, {
        error: 'Authentication status check failed'
      });
    }
  }, []);

  useEffect(() => {
    // Initial status check with delay to allow for session initialization
    const timer = setTimeout(() => {
      checkAuthStatus();
    }, 1000);

    return () => clearTimeout(timer);
  }, [checkAuthStatus]);

  const login = useCallback(async (username: string, password: string): Promise<GP51AuthResult> => {
    console.log(`🔐 [GP51Auth] Starting GP51 login for: ${username}`);
    
    await gp51AuthStateManager.setAuthenticating(true);
    gp51AuthStateManager.clearError();

    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: username.trim(),
          password
        }
      });

      if (error) {
        console.error('❌ [GP51Auth] Login error:', error);
        const errorMessage = error.message || 'Authentication failed';
        
        await gp51AuthStateManager.setAuthenticated(false, { error: errorMessage });
        
        toast({
          title: "GP51 Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return { success: false, error: errorMessage };
      }

      if (!data.success) {
        console.error('❌ [GP51Auth] Authentication failed:', data.error);
        
        await gp51AuthStateManager.setAuthenticated(false, { error: data.error });
        
        toast({
          title: "GP51 Authentication Failed",
          description: data.error || 'Invalid credentials',
          variant: "destructive",
        });
        return { success: false, error: data.error };
      }

      console.log('✅ [GP51Auth] Authentication successful:', {
        sessionId: data.session?.id,
        username: data.session?.username,
        expiresAt: data.session?.expiresAt,
        tokenLength: data.session?.tokenLength,
        verified: data.verification
      });

      const expiresAt = data.session?.expiresAt ? new Date(data.session.expiresAt) : undefined;
      
      // Set authenticated state with session persistence delay
      await gp51AuthStateManager.setAuthenticated(true, {
        username: data.session?.username || username.trim(),
        tokenExpiresAt: expiresAt
      });

      // Force a session validation after the delay
      setTimeout(async () => {
        console.log('🔄 [GP51Auth] Validating session after authentication...');
        await checkAuthStatus();
      }, 3000);

      // Show detailed success notification
      toast({
        title: "GP51 Connected Successfully",
        description: `Authenticated as ${username}. Session stored and verified.`,
      });

      // Show additional details in console for debugging
      if (data.verification) {
        console.log('🔍 [GP51Auth] Session verification details:', data.verification);
        if (data.verification.tokenTest?.success === false) {
          toast({
            title: "Warning: Token Test Failed",
            description: "Authentication succeeded but token validation failed. Please check logs.",
            variant: "destructive",
          });
        }
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('❌ [GP51Auth] Login exception:', error);
      
      await gp51AuthStateManager.setAuthenticated(false, { error: errorMessage });
      
      toast({
        title: "GP51 Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [toast, checkAuthStatus]);

  const logout = useCallback(async (): Promise<GP51AuthResult> => {
    console.log('👋 [GP51Auth] Logging out from GP51...');
    await gp51AuthStateManager.setAuthenticating(true);

    try {
      const { error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'clear-gp51-sessions' }
      });

      if (error) {
        console.error('❌ [GP51Auth] Logout error:', error);
        toast({
          title: "Logout Error",
          description: "Failed to clear GP51 sessions",
          variant: "destructive",
        });
      }

      await gp51AuthStateManager.setAuthenticated(false);

      toast({
        title: "GP51 Disconnected",
        description: "Successfully logged out from GP51",
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      console.error('❌ [GP51Auth] Logout exception:', error);
      await gp51AuthStateManager.setAuthenticated(false, { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const refreshStatus = useCallback(() => {
    console.log('🔄 [GP51Auth] Refreshing status...');
    checkAuthStatus();
  }, [checkAuthStatus]);

  const clearError = useCallback(() => {
    gp51AuthStateManager.clearError();
  }, []);

  return {
    ...authState,
    login,
    logout,
    refreshStatus,
    clearError,
  };
};
