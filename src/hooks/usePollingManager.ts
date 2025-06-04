
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PollingConfig {
  intervalSeconds: number;
  autoStart: boolean;
  maxRetries: number;
}

export const usePollingManager = (config: PollingConfig = {
  intervalSeconds: 30,
  autoStart: false,
  maxRetries: 3
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Polling mutation
  const pollingMutation = useMutation({
    mutationFn: async () => {
      console.log('Triggering GP51 polling...');
      
      const { data, error } = await supabase.functions.invoke('gp51-realtime-polling', {
        body: { 
          trigger: 'frontend',
          timestamp: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Polling function error:', error);
        throw new Error(error.message || 'Failed to invoke polling function');
      }

      if (data?.error) {
        console.error('Polling data error:', data.error);
        throw new Error(data.error);
      }

      console.log('Polling successful:', data);
      return data;
    },
    onSuccess: (data) => {
      console.log(`Successfully updated ${data.vehiclesUpdated || 0} vehicles`);
      setErrorCount(0);
      
      // Invalidate relevant queries to trigger UI updates
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['recent-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['polling-status'] });
    },
    onError: (error: any) => {
      console.error('Polling failed:', error);
      setErrorCount(prev => prev + 1);
      
      if (errorCount >= config.maxRetries) {
        console.error('Max retries reached, stopping polling');
        stopPolling();
        toast({
          title: 'Polling Stopped',
          description: `Too many errors (${config.maxRetries}). Please check GP51 connection.`,
          variant: 'destructive',
        });
      }
    },
  });

  const startPolling = () => {
    if (intervalRef.current) return;

    console.log(`Starting polling every ${config.intervalSeconds} seconds...`);
    setIsRunning(true);
    setErrorCount(0);

    // Trigger immediately
    pollingMutation.mutate();

    // Set up interval
    intervalRef.current = window.setInterval(() => {
      pollingMutation.mutate();
    }, config.intervalSeconds * 1000);

    toast({
      title: 'Real-time Updates Started',
      description: `Vehicle data will update every ${config.intervalSeconds} seconds`,
    });
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsRunning(false);
      console.log('Polling stopped');
      
      toast({
        title: 'Real-time Updates Stopped',
        description: 'Automatic vehicle data updates have been disabled',
      });
    }
  };

  const triggerManualUpdate = () => {
    pollingMutation.mutate();
  };

  // Auto-start if configured
  useEffect(() => {
    if (config.autoStart) {
      startPolling();
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [config.autoStart]);

  return {
    isRunning,
    errorCount,
    isUpdating: pollingMutation.isPending,
    startPolling,
    stopPolling,
    triggerManualUpdate,
    lastUpdateTime: pollingMutation.data?.timestamp
  };
};
