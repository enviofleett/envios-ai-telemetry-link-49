
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GP51AuthResult {
  success: boolean;
  error?: string;
  user?: any;
  session?: any;
}

interface GP51AuthState {
  isAuthenticated: boolean;
  username?: string;
  token?: string;
  expiresAt?: Date;
  isLoading: boolean;
  error: string | null;
  isCheckingStatus: boolean;
}

const GP51_SESSION_KEY = 'consolidated_gp51_session';

export const useConsolidatedGP51Auth = () => {
  const [authState, setAuthState] = useState<GP51AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isCheckingStatus: true,
  });
  const { toast } = useToast();

  // Restore session from localStorage on mount
  useEffect(() => {
    console.log('🔍 [ConsolidatedGP51Auth] Restoring session from localStorage...');
    try {
      const storedSession = localStorage.getItem(GP51_SESSION_KEY);
      if (storedSession) {
        const session = JSON.parse(storedSession);
        const expiresAt = new Date(session.expiresAt);
        
        if (expiresAt > new Date()) {
          console.log(`✅ Restored GP51 session for ${session.username}. Expires at: ${expiresAt.toLocaleString()}`);
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            username: session.username,
            token: session.token,
            expiresAt,
            isCheckingStatus: false,
          }));
        } else {
          console.log('🕒 Stored GP51 session expired. Clearing.');
          localStorage.removeItem(GP51_SESSION_KEY);
          setAuthState(prev => ({ ...prev, isCheckingStatus: false }));
        }
      } else {
        setAuthState(prev => ({ ...prev, isCheckingStatus: false }));
      }
    } catch (error) {
      console.error('Failed to restore GP51 session:', error);
      localStorage.removeItem(GP51_SESSION_KEY);
      setAuthState(prev => ({ ...prev, isCheckingStatus: false }));
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<GP51AuthResult> => {
    console.log(`🔐 [ConsolidatedGP51Auth] Starting login for: ${username}`);
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('gp51-hybrid-auth', {
        body: {
          action: 'authenticate',
          username: username.trim(),
          password
        }
      });

      if (error) {
        console.error('❌ [ConsolidatedGP51Auth] Edge Function error:', error);
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
        console.error('❌ [ConsolidatedGP51Auth] Authentication failed:', data.error);
        setAuthState(prev => ({ ...prev, isLoading: false, error: data.error }));
        toast({
          title: "GP51 Authentication Failed",
          description: data.error || 'Invalid credentials',
          variant: "destructive",
        });
        return { success: false, error: data.error };
      }

      console.log('✅ [ConsolidatedGP51Auth] Authentication successful');
      
      // Store session data
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const sessionData = {
        username: username.trim(),
        token: data.token,
        expiresAt: expiresAt.toISOString(),
      };
      
      localStorage.setItem(GP51_SESSION_KEY, JSON.stringify(sessionData));
      
      setAuthState({
        isAuthenticated: true,
        username: username.trim(),
        token: data.token,
        expiresAt,
        isLoading: false,
        error: null,
        isCheckingStatus: false,
      });

      toast({
        title: "GP51 Connected Successfully",
        description: `Authenticated as ${username}. Session stored.`,
      });

      return { 
        success: true, 
        user: data.user,
        session: data.session 
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      console.error('❌ [ConsolidatedGP51Auth] Login exception:', error);
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
    console.log('👋 [ConsolidatedGP51Auth] Logging out from GP51...');
    
    // Clear local session
    localStorage.removeItem(GP51_SESSION_KEY);
    
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isCheckingStatus: false,
      username: undefined,
      token: undefined,
      expiresAt: undefined,
    });

    toast({
      title: "GP51 Disconnected",
      description: "Successfully logged out from GP51",
    });

    return { success: true };
  }, [toast]);

  const getToken = useCallback((): string | null => {
    if (!authState.isAuthenticated || !authState.token) {
      return null;
    }
    
    // Check if token is expired
    if (authState.expiresAt && authState.expiresAt < new Date()) {
      console.warn("GP51 token has expired");
      logout();
      return null;
    }
    
    return authState.token;
  }, [authState, logout]);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    logout,
    getToken,
    clearError,
  };
};
