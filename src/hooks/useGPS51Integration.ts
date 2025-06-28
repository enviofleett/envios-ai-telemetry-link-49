
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { gps51SessionManager } from '@/services/gps51/GPS51SessionManager';

export interface GPS51AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  username?: string;
  sessionData?: any;
}

export const useGPS51Integration = () => {
  const [authState, setAuthState] = useState<GPS51AuthState>({
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  // Initialize and check existing session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('🔄 Initializing GPS51 session...');
        
        // Initialize the session manager
        await gps51SessionManager.initialize();
        
        // Check if we have a valid session
        const isValid = await gps51SessionManager.validateSession();
        
        if (isValid) {
          const sessionData = gps51SessionManager.getSession();
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            error: null,
            username: sessionData?.username,
            sessionData
          });
          console.log('✅ GPS51 session restored successfully');
        } else {
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          console.log('ℹ️ No valid GPS51 session found');
        }
      } catch (error) {
        console.error('❌ Failed to initialize GPS51 session:', error);
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Session initialization failed'
        });
      }
    };

    initializeSession();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      console.log('🔐 Attempting GPS51 login...');
      
      // Authenticate with GP51 using the edge function
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          action: 'authenticate',
          username,
          password
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || error?.message || 'Authentication failed');
      }

      console.log('✅ GPS51 authentication successful');

      // Store session data in GPS51SessionManager
      await gps51SessionManager.setSessionFromAuth(username, data.token);

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        error: null,
        username: data.username,
        sessionData: data
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('❌ GPS51 login failed:', errorMessage);
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage
      });
      
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('👋 Logging out of GPS51...');
      await gps51SessionManager.clearSession();
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      
      console.log('✅ GPS51 logout successful');
    } catch (error) {
      console.error('❌ GPS51 logout error:', error);
    }
  }, []);

  return {
    ...authState,
    login,
    logout,
    refreshSession: () => gps51SessionManager.refreshSession()
  };
};
