
import { useState, useEffect } from 'react';
import { gp51SessionManager } from '@/services/gp51SessionManager';

interface GP51SessionStatus {
  isGP51Authenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionInfo: {
    username?: string;
    expiresAt?: Date;
    isValid?: boolean;
  } | null;
}

export const useGP51SessionStatus = (): GP51SessionStatus => {
  const [status, setStatus] = useState<GP51SessionStatus>({
    isGP51Authenticated: false,
    isLoading: true,
    error: null,
    sessionInfo: null
  });

  useEffect(() => {
    const checkGP51Status = async () => {
      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));

        // Get current session from manager
        const currentSession = gp51SessionManager.getCurrentSession();
        
        if (currentSession && currentSession.isValid) {
          setStatus({
            isGP51Authenticated: true,
            isLoading: false,
            error: null,
            sessionInfo: {
              username: currentSession.username,
              expiresAt: currentSession.expiresAt,
              isValid: currentSession.isValid
            }
          });
          return;
        }

        // Try to validate and ensure session
        const session = await gp51SessionManager.validateAndEnsureSession();
        
        if (session && session.isValid) {
          setStatus({
            isGP51Authenticated: true,
            isLoading: false,
            error: null,
            sessionInfo: {
              username: session.username,
              expiresAt: session.expiresAt,
              isValid: session.isValid
            }
          });
        } else {
          setStatus({
            isGP51Authenticated: false,
            isLoading: false,
            error: 'GP51 session not available. Please configure GP51 credentials in Admin Settings.',
            sessionInfo: null
          });
        }
      } catch (error) {
        console.error('GP51 session check failed:', error);
        setStatus({
          isGP51Authenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to check GP51 session status',
          sessionInfo: null
        });
      }
    };

    // Initial check
    checkGP51Status();

    // Subscribe to session changes
    const unsubscribe = gp51SessionManager.subscribe((session) => {
      if (session && session.isValid) {
        setStatus({
          isGP51Authenticated: true,
          isLoading: false,
          error: null,
          sessionInfo: {
            username: session.username,
            expiresAt: session.expiresAt,
            isValid: session.isValid
          }
        });
      } else {
        setStatus(prev => ({
          isGP51Authenticated: false,
          isLoading: false,
          error: prev.error || 'GP51 session expired or not configured',
          sessionInfo: null
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
};
