
import { useState, useEffect } from 'react';
import { realConnectionTester, type GP51ConnectionHealth } from '@/services/gp51/realConnectionTester';

export const useGP51ConnectionHealth = () => {
  const [health, setHealth] = useState<GP51ConnectionHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const healthStatus = await realConnectionTester.testRealConnection();
      setHealth(healthStatus);
    } catch (error) {
      console.error('Failed to check GP51 health:', error);
      setHealth({
        isConnected: false,
        sessionValid: false,
        apiReachable: false,
        dataFlowing: false,
        errorMessage: 'Health check failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    health,
    isLoading,
    checkHealth,
    isHealthy: health?.isConnected && health?.dataFlowing,
    lastCheck: health?.lastCheck
  };
};
