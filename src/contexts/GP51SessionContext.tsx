
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { sessionHealthMonitor } from '@/services/gp51/sessionHealthMonitor';
import { SessionHealth } from '@/services/sessionValidation/types';

interface GP51SessionContextType {
  session: any | null;
  health: SessionHealth | null;
  isLoading: boolean;
  error: string | null;
  refreshSession: () => Promise<void>;
}

const GP51SessionContext = createContext<GP51SessionContextType | undefined>(undefined);

interface GP51SessionProviderProps {
  children: ReactNode;
}

export const GP51SessionProvider: React.FC<GP51SessionProviderProps> = ({ children }) => {
  const [health, setHealth] = useState<SessionHealth | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to health updates
    const unsubscribe = sessionHealthMonitor.onHealthUpdate((newHealth) => {
      setHealth(newHealth);
      setError(newHealth.isValid ? null : newHealth.errorMessage || 'Connection failed');
    });

    // Start monitoring
    sessionHealthMonitor.startMonitoring();

    return () => {
      unsubscribe();
      sessionHealthMonitor.stopMonitoring();
    };
  }, []);

  const refreshSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await sessionHealthMonitor.forceHealthCheck();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GP51SessionContext.Provider value={{
      session,
      health,
      isLoading,
      error,
      refreshSession
    }}>
      {children}
    </GP51SessionContext.Provider>
  );
};

export const useGP51Session = () => {
  const context = useContext(GP51SessionContext);
  if (context === undefined) {
    throw new Error('useGP51Session must be used within a GP51SessionProvider');
  }
  return context;
};
