import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GP51SessionManager } from '@/services/gp51/sessionManager';

// Interfaces
export interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
  isLoading: boolean;
  error: string | null;
  isRestoringSession: boolean;
}

export const useGP51Auth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    isRestoringSession: true,
  });
  const { toast } = useToast();

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);
  
  // Effect for restoring session from database on initial load
  useEffect(() => {
    console.log('🔍 useGP51Auth: Initializing and restoring session from database...');
    const restoreSession = async () => {
      try {
        const { valid, session } = await GP51SessionManager.validateSession();
        if (valid && session) {
          const expiresAt = new Date(session.token_expires_at);
          console.log(`✅ Restored session for ${session.username}. Expires at: ${expiresAt.toLocaleString()}`);
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            username: session.username,
            tokenExpiresAt: expiresAt,
          }));
        } else {
          console.log('No valid session found in database or session expired.');
        }
      } catch (error) {
        console.error('Failed to restore session from database:', error);
      } finally {
        setAuthState(prev => ({ ...prev, isRestoringSession: false }));
      }
    };
    restoreSession();
  }, []);
  

  const login = useCallback(async (username: string, password: string): Promise<AuthResult> => {
    console.log(`🔐 useGP51Auth: Starting login for ${username} via edge function`);
    setAuthState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null, 
      isRestoringSession: false 
    }));

    try {
      // Clear any previous sessions before attempting a new login to ensure a clean state.
      await GP51SessionManager.clearAllSessions();

      const { data, error } = await supabase.functions.invoke('gp51-auth-service', {
        body: {
          action: 'test_authentication',
          username: username,
          password: password,
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Invalid username or password');
      }

      console.log('✅ useGP51Auth: Login successful via edge function. Session stored in database.');
      
      // Fetch the newly created session from the database to populate the auth state.
      const { valid, session } = await GP51SessionManager.validateSession();

      if (valid && session) {
        const expiresAt = new Date(session.token_expires_at);
        setAuthState({
          isAuthenticated: true,
          username: session.username,
          tokenExpiresAt: expiresAt,
          isLoading: false,
          error: null,
          isRestoringSession: false,
        });

        toast({
          title: "Login Successful",
          description: `Connected to GP51 as ${session.username}.`,
        });
        return { success: true };
      } else {
        throw new Error("Failed to retrieve session from database after login.");
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        
      console.error('❌ useGP51Auth: Login failed:', errorMessage);
      setAuthState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<AuthResult> => {
    console.log('👋 useGP51Auth: Logging out and clearing database session...');
    
    try {
      await GP51SessionManager.clearAllSessions();
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        isRestoringSession: false,
        username: undefined,
        tokenExpiresAt: undefined,
      });
      toast({
        title: "Logged Out",
        description: "Disconnected from GP51.",
      });
      return { success: true };
    } catch(error) {
        console.error("Failed to clear sessions during logout", error);
        // Still log out on the client side even if server-side clearing fails
        setAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: "Failed to clear server session, but logged out locally.",
            isRestoringSession: false,
            username: undefined,
            tokenExpiresAt: undefined,
        });
        return { success: false, error: "Failed to clear server session." };
    }
  }, [toast]);

  const getToken = useCallback(async (): Promise<string | null> => {
    const { valid, session } = await GP51SessionManager.validateSession();
    if (!valid || !session) {
      if (authState.isAuthenticated) {
        console.warn("Session invalid or expired, logging out.");
        logout();
      }
      return null;
    }
    return session.gp51_token;
  }, [logout, authState.isAuthenticated]);

  // Health check now validates the session in the database
  const healthCheck = useCallback(async (): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    const { valid } = await GP51SessionManager.validateSession();
    if (!valid) {
        setAuthState(prev => ({ ...prev, isLoading: false, error: 'Not authenticated.' }));
        return false;
    }
    console.log('✅ Health check passed (database session valid).');
    setAuthState(prev => ({ ...prev, isLoading: false }));
    return true;
  }, []);

  return {
    ...authState,
    login,
    logout,
    getToken,
    healthCheck,
    clearError,
  };
};
