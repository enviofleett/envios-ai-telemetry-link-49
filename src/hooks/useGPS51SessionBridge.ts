
import { useState, useEffect, useCallback } from 'react';
import { gps51SessionManager } from '@/services/gps51/GPS51SessionManager';
import { useGPS51Integration } from '@/hooks/useGPS51Integration';

export interface GPS51SessionBridge {
  isSessionReady: boolean;
  hasValidSession: boolean;
  isLoading: boolean;
  error: string | null;
  initializeSession: () => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
}

export const useGPS51SessionBridge = (): GPS51SessionBridge => {
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { isAuthenticated } = useGPS51Integration();

  const initializeSession = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize the session manager
      await gps51SessionManager.initialize();
      
      // Check if session is valid
      const isValid = await gps51SessionManager.validateSession();
      
      if (isValid) {
        setHasValidSession(true);
        setIsSessionReady(true);
        console.log('✅ GPS51 session bridge initialized successfully');
        return true;
      } else {
        setHasValidSession(false);
        setError('GPS51 session validation failed');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Session initialization failed';
      setError(errorMessage);
      console.error('❌ GPS51 session bridge initialization failed:', errorMessage);
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
        setHasValidSession(true);
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

  // Initialize session on mount and when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      initializeSession();
    } else {
      setIsSessionReady(false);
      setHasValidSession(false);
      setIsLoading(false);
    }
  }, [isAuthenticated, initializeSession]);

  // Periodic session validation
  useEffect(() => {
    if (!hasValidSession) return;

    const interval = setInterval(async () => {
      const isValid = await gps51SessionManager.validateSession();
      if (!isValid) {
        setHasValidSession(false);
        setError('Session expired or invalid');
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [hasValidSession]);

  return {
    isSessionReady,
    hasValidSession,
    isLoading,
    error,
    initializeSession,
    refreshSession
  };
};
