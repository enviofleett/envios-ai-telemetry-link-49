
import { useState, useEffect, useCallback } from 'react';
import { gps51SessionManager } from '@/services/gp51/GPS51SessionManager';
import { gps51AuthService } from '@/services/gp51/GPS51AuthService';

export interface GPS51SessionBridge {
  isSessionReady: boolean;
  hasValidSession: boolean;
  isLoading: boolean;
  error: string | null;
  username: string | null;
  initializeSession: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
}

export const useGPS51SessionBridge = (): GPS51SessionBridge => {
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const initializeSession = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 GPS51 session bridge initialization...');
      
      // Initialize the session manager
      const initialized = await gps51SessionManager.initialize();
      
      if (initialized) {
        // Validate the session
        const isValid = await gps51SessionManager.validateSession();
        
        if (isValid) {
          const session = gps51SessionManager.getSession();
          setHasValidSession(true);
          setIsSessionReady(true);
          setUsername(session?.username || null);
          console.log('✅ GPS51 session bridge ready');
          return true;
        }
      }
      
      setHasValidSession(false);
      setError('No valid GPS51 session found');
      console.log('❌ GPS51 session bridge - no valid session');
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session initialization failed';
      setError(errorMessage);
      console.error('❌ GPS51 session bridge error:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      const refreshed = await gps51SessionManager.refreshSession();
      
      if (refreshed) {
        const session = gps51SessionManager.getSession();
        setHasValidSession(true);
        setUsername(session?.username || null);
        console.log('✅ GPS51 session refreshed via bridge');
      } else {
        setHasValidSession(false);
        setError('Session refresh failed');
      }
      
      return refreshed;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session refresh failed';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Auto-initialize on mount
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  return {
    isSessionReady,
    hasValidSession,
    isLoading,
    error,
    username,
    initializeSession,
    refreshSession
  };
};
