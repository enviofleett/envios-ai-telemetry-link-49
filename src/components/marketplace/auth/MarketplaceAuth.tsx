
import React, { useState } from 'react';
import { useSecurityContext } from '@/components/security/SecurityProvider';

interface MarketplaceAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const MarketplaceAuth: React.FC<MarketplaceAuthProps> = ({ onSuccess, onError }) => {
  const { logSecurityEvent } = useSecurityContext();
  const [attemptCount, setAttemptCount] = useState(0);

  const handleAuthAttempt = async (email: string, password: string) => {
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
    }
  };

  const handleLogout = () => {
    logSecurityEvent({
      type: 'authentication',
      severity: 'low',
      description: 'Merchant logout',
      additionalData: { 
        timestamp: Date.now()
      }
    });
  };

  return {
    handleAuthAttempt,
    handleLogout,
    attemptCount
  };
};
