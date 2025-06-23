
import { useState, useEffect, useCallback } from 'react';
import { realConnectionTester, type GP51ConnectionHealth } from '@/services/gp51/realConnectionTester';
import { useToast } from '@/hooks/use-toast';

export const useRealGP51Connection = () => {
  const [connectionHealth, setConnectionHealth] = useState<GP51ConnectionHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { toast } = useToast();

  const performRealConnectionTest = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Performing real GP51 connection test...');
      const health = await realConnectionTester.testRealConnection();
      setConnectionHealth(health);
      setLastChecked(new Date());
      
      // Show toast for significant connection changes
      if (health.isConnected && health.dataFlowing) {
        toast({
          title: "GP51 Connection Healthy",
          description: `API responding in ${health.apiResponseTime}ms with ${health.deviceCount} devices`,
        });
      } else if (!health.isConnected) {
        toast({
          title: "GP51 Connection Issues",
          description: health.errorMessage || "Unable to connect to GP51 API",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Real connection test failed:', error);
      setConnectionHealth({
        isConnected: false,
        sessionValid: false,
        apiReachable: false,
        dataFlowing: false,
        errorMessage: error instanceof Error ? error.message : 'Connection test failed'
      });
      toast({
        title: "Connection Test Failed",
        description: "Unable to test GP51 connection",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const generateDetailedReport = useCallback(async () => {
    try {
      return await realConnectionTester.generateConnectionReport();
    } catch (error) {
      console.error('❌ Failed to generate connection report:', error);
      throw error;
    }
  }, []);

  // Auto-test connection on mount
  useEffect(() => {
    performRealConnectionTest();
  }, [performRealConnectionTest]);

  // Auto-refresh every 2 minutes for real-time monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      performRealConnectionTest();
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [performRealConnectionTest]);

  return {
    connectionHealth,
    isLoading,
    lastChecked,
    performRealConnectionTest,
    generateDetailedReport,
    isHealthy: connectionHealth?.isConnected && connectionHealth?.dataFlowing,
    isDegraded: connectionHealth?.sessionValid && connectionHealth?.apiReachable && !connectionHealth?.dataFlowing,
    isCritical: !connectionHealth?.sessionValid || !connectionHealth?.apiReachable
  };
};
