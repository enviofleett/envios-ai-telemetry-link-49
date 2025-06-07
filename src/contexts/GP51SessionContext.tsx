
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { unifiedGP51SessionManager, GP51SessionInfo, SessionHealth } from '@/services/unifiedGP51SessionManager';

interface GP51SessionContextType {
  session: GP51SessionInfo | null;
  health: SessionHealth | null;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
  performHealthCheck: () => Promise<void>;
  forceReconnection: () => Promise<{ success: boolean; message: string }>;
}

const GP51SessionContext = createContext<GP51SessionContextType | undefined>(undefined);

interface GP51SessionProviderProps {
  children: ReactNode;
}

export const GP51SessionProvider: React.FC<GP51SessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<GP51SessionInfo | null>(null);
  const [health, setHealth] = useState<SessionHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to session changes
    const unsubscribeSession = unifiedGP51SessionManager.subscribeToSession((newSession) => {
      setSession(newSession);
      setError(newSession ? null : 'No active session');
      setIsLoading(false);
    });

    // Subscribe to health changes
    const unsubscribeHealth = unifiedGP51SessionManager.subscribeToHealth((newHealth) => {
      setHealth(newHealth);
      if (newHealth.errorMessage) {
        setError(newHealth.errorMessage);
      }
    });

    // Initial session check
    const currentSession = unifiedGP51SessionManager.getCurrentSession();
    const currentHealth = unifiedGP51SessionManager.getCurrentHealth();
    
    if (currentSession) {
      setSession(currentSession);
      setError(null);
    }
    
    if (currentHealth) {
      setHealth(currentHealth);
    }
    
    setIsLoading(false);

    return () => {
      unsubscribeSession();
      unsubscribeHealth();
    };
  }, []);

  const refreshSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await unifiedGP51SessionManager.validateAndEnsureSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh session');
    } finally {
      setIsLoading(false);
    }
  };

  const performHealthCheck = async () => {
    try {
      await unifiedGP51SessionManager.performHealthCheck();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    }
  };

  const forceReconnection = async () => {
    setIsLoading(true);
    try {
      const result = await unifiedGP51SessionManager.attemptReconnection();
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Reconnection failed';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const value: GP51SessionContextType = {
    session,
    health,
    isLoading,
    error,
    refreshSession,
    performHealthCheck,
    forceReconnection,
  };

  return (
    <GP51SessionContext.Provider value={value}>
      {children}
    </GP51SessionContext.Provider>
  );
};

export const useGP51Session = (): GP51SessionContextType => {
  const context = useContext(GP51SessionContext);
  if (context === undefined) {
    throw new Error('useGP51Session must be used within a GP51SessionProvider');
  }
  return context;
};
