
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StablePollingConfig {
  intervalSeconds: number;
  autoStart: boolean;
  maxRetries: number;
}

export const useStablePollingManager = (config: StablePollingConfig = {
  intervalSeconds: 60,
  autoStart: false,
  maxRetries: 3
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Stable polling mutation with comprehensive error handling
  const pollingMutation = useMutation({
    mutationFn: async () => {
      console.log('Triggering stable GP51 polling...');
      
      try {
        const { data, error } = await supabase.functions.invoke('gp51-realtime-polling', {
          body: { 
            trigger: 'stable-frontend',
            timestamp: new Date().toISOString()
          }
        });

        if (error) {
          console.error('Stable polling function error:', error);
          throw new Error(error.message || 'Failed to invoke stable polling function');
        }

        if (data?.error) {
          console.error('Stable polling data error:', data.error);
          throw new Error(data.error);
        }

        console.log('Stable polling successful:', data);
        return data;
      } catch (error: any) {
        // Enhanced error logging for debugging
        console.error('Stable polling critical error:', {
          error,
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log(`Stable polling: Successfully updated ${data?.vehiclesUpdated || 0} vehicles`);
      setErrorCount(0);
      setLastError(null);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['stable-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['polling-status'] });
    },
    onError: (error: any) => {
      console.error('Stable polling failed:', error);
      const errorMessage = error.message || 'Unknown polling error';
      setLastError(errorMessage);
      setErrorCount(prev => {
        const newCount = prev + 1;
        
        if (newCount >= config.maxRetries) {
          console.error('Stable polling: Max retries reached, stopping');
          stopPolling();
          toast({
            title: 'Polling System Error',
            description: `Automatic updates failed after ${config.maxRetries} attempts. System will retry manually.`,
            variant: 'destructive',
          });
        }
        
        return newCount;
      });
    },
  });

  const startPolling = () => {
    if (intervalRef.current) {
      console.log('Stable polling already running');
      return;
    }

    console.log(`Starting stable polling every ${config.intervalSeconds} seconds...`);
    setIsRunning(true);
    setErrorCount(0);
    setLastError(null);

    // Trigger immediately with delay to ensure system stability
    setTimeout(() => {
      pollingMutation.mutate();
    }, 2000);

    // Set up stable interval
    intervalRef.current = window.setInterval(() => {
      if (errorCount < config.maxRetries) {
        pollingMutation.mutate();
      }
    }, config.intervalSeconds * 1000);

    toast({
      title: 'Stable Updates Started',
      description: `Vehicle data will update every ${config.intervalSeconds} seconds`,
    });
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
      console.log('Stable polling stopped');
      
      toast({
        title: 'Updates Stopped',
        description: 'Automatic vehicle data updates have been disabled',
      });
    }
  };

  const triggerManualUpdate = () => {
    console.log('Triggering stable manual update...');
    pollingMutation.mutate();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    errorCount,
    lastError,
    isUpdating: pollingMutation.isPending,
    startPolling,
    stopPolling,
    triggerManualUpdate,
    lastUpdateTime: pollingMutation.data?.timestamp
  };
};
