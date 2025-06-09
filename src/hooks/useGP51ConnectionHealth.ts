
import { useState, useEffect } from 'react';
import { unifiedGP51SessionManager, SessionHealth } from '@/services/unifiedGP51SessionManager';

export const useGP51ConnectionHealth = () => {
  const [status, setStatus] = useState<SessionHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Subscribe to health updates
    const unsubscribe = unifiedGP51SessionManager.subscribeToHealth((health) => {
      setStatus(health);
    });

    // Get current health
    const currentHealth = unifiedGP51SessionManager.getCurrentHealth();
    if (currentHealth) {
      setStatus(currentHealth);
    }

    return unsubscribe;
  }, []);

  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      await unifiedGP51SessionManager.performHealthCheck();
    } finally {
      setIsLoading(false);
    }
  };

  const attemptReconnection = async () => {
    setIsLoading(true);
    try {
      return await unifiedGP51SessionManager.attemptReconnection();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    isLoading,
    performHealthCheck,
    attemptReconnection,
  };
};
