
import { useState, useCallback } from 'react';
import { unifiedGP51Service } from '@/services/gp51/UnifiedGP51Service';
import { useToast } from '@/hooks/use-toast';

export const useGP51Connection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!unifiedGP51Service.isAuthenticated) {
        throw new Error('Not authenticated with GP51');
      }

      // Test connection by querying monitor list
      const result = await unifiedGP51Service.queryMonitorList();
      
      if (!result.success) {
        throw new Error(result.error || 'Connection test failed');
      }

      toast({
        title: "Connection Successful",
        description: `Connected to GP51 with ${result.data?.length || 0} devices`,
      });

      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      setError(errorMsg);
      
      toast({
        title: "Connection Failed",
        description: errorMsg,
        variant: "destructive"
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchLiveData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!unifiedGP51Service.isAuthenticated) {
        throw new Error('Not authenticated with GP51');
      }

      const result = await unifiedGP51Service.queryMonitorList();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch live data');
      }

      return result.data || [];
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch live data';
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    checkConnection,
    fetchLiveData,
    isAuthenticated: unifiedGP51Service.isAuthenticated
  };
};
