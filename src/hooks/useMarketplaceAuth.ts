
import { useState, useCallback } from 'react';
import { useSecurityContext } from '@/components/security/SecurityProvider';

interface UseMarketplaceAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useMarketplaceAuth = ({ onSuccess, onError }: UseMarketplaceAuthProps = {}) => {
  const { logSecurityEvent } = useSecurityContext();
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAttempt = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    const now = Date.now();
    const newAttemptCount = attemptCount + 1;
    setAttemptCount(newAttemptCount);

    // Check rate limiting
    if (newAttemptCount > 5) {
      const resetTime = now + (15 * 60 * 1000); // 15 minutes from now
      const timeUntilReset = Math.ceil((resetTime - now) / 1000 / 60);
      
      logSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        description: 'Login rate limit exceeded for merchant email',
        additionalData: { 
          email, 
          attempts: String(newAttemptCount),
          resetTimeMinutes: timeUntilReset
        }
      });
      
      onError?.(`Too many attempts. Try again in ${timeUntilReset} minutes.`);
      setIsLoading(false);
      return;
    }

    try {
      // Simulate authentication process
      logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        description: 'Merchant login attempt',
        additionalData: { 
          email,
          userAgent: navigator.userAgent
        }
      });

      // Success case
      logSecurityEvent({
        type: 'authentication',
        severity: 'low',
        description: 'Merchant login successful',
        additionalData: { email }
      });

      onSuccess?.();
      setAttemptCount(0); // Reset on success
    } catch (error) {
      logSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        description: 'Merchant login failed',
        additionalData: { 
          email,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      onError?.('Authentication failed');
    } finally {
      setIsLoading(false);
    }
  }, [attemptCount, logSecurityEvent, onSuccess, onError]);

  const handleLogout = useCallback(() => {
    logSecurityEvent({
      type: 'authentication',
      severity: 'low',
      description: 'Merchant logout',
      additionalData: { 
        timestamp: Date.now()
      }
    });
    setAttemptCount(0);
  }, [logSecurityEvent]);

  return {
    handleAuthAttempt,
    handleLogout,
    attemptCount,
    isLoading
  };
};
