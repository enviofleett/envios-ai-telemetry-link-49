
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const checkAuthStatus = useCallback(async () => {
    console.log('🔍 Checking GP51 authentication status...');
    setAuthState(prev => ({ ...prev, isCheckingStatus: true }));

    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      if (error) {
        console.error('❌ Status check error:', error);
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          error: 'Failed to check authentication status',
          isCheckingStatus: false
        }));
        return;
      }

      const isAuthenticated = data.connected && !data.isExpired;
      console.log(`📊 GP51 Status: ${isAuthenticated ? 'Connected' : 'Disconnected'}`);

      setAuthState(prev => ({
        ...prev,
        isAuthenticated,
        username: data.username,
        tokenExpiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        error: null,
        isCheckingStatus: false
      }));

    } catch (error) {
      console.error('❌ Status check failed:', error);
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        error: 'Authentication status check failed',
        isCheckingStatus: false
      }));
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const login = useCallback(async (username: string, password: string): Promise<GP51AuthResult> => {
    console.log(`🔐 Starting GP51 login for: ${username}`);
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: username.trim(),
          password
        }
      });

      if (error) {
        console.error('❌ Login error:', error);
        const errorMessage = error.message || 'Authentication failed';
        setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        toast({
          title: "GP51 Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
        return { success: false, error: errorMessage };
      }

      if (!data.success) {
        console.error('❌ GP51 authentication failed:', data.error);
        setAuthState(prev => ({ ...prev, isLoading: false, error: data.error }));
        toast({
          title: "GP51 Authentication Failed",
          description: data.error || 'Invalid credentials',
          variant: "destructive",
        });
        return { success: false, error: data.error };
      }

      console.log('✅ GP51 authentication successful');
      const expiresAt = data.session?.expiresAt ? new Date(data.session.expiresAt) : undefined;
      
      setAuthState({
        isAuthenticated: true,
        username: data.session?.username || username.trim(),
        tokenExpiresAt: expiresAt,
        isLoading: false,
        error: null,
        isCheckingStatus: false
      });

      toast({
        title: "GP51 Connected",
        description: `Successfully authenticated as ${username}`,
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('❌ Login exception:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: "GP51 Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<GP51AuthResult> => {
    console.log('👋 Logging out from GP51...');
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const { error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'clear-gp51-sessions' }
      });

      if (error) {
        console.error('❌ Logout error:', error);
        toast({
          title: "Logout Error",
          description: "Failed to clear GP51 sessions",
          variant: "destructive",
        });
      }

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isCheckingStatus: false,
        username: undefined,
        tokenExpiresAt: undefined,
      });

      toast({
        title: "GP51 Disconnected",
        description: "Successfully logged out from GP51",
      });

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      console.error('❌ Logout exception:', error);
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const refreshStatus = useCallback(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    logout,
    refreshStatus,
    clearError,
  };
};
