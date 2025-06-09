
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GP51ConnectionStatus } from './types';

export const useGP51Connection = () => {
  const [connectionStatus, setConnectionStatus] = useState<GP51ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Checking GP51 connection...');

      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) throw error;

      if (data.success) {
        setConnectionStatus({
          connected: true,
          username: data.username,
          apiUrl: data.apiUrl,
          lastCheck: new Date().toISOString()
        });
        toast({
          title: "Connection Successful",
          description: `Connected to GP51 as ${data.username}`
        });
      } else {
        setConnectionStatus({
          connected: false,
          error: data.error || 'Connection failed',
          lastCheck: new Date().toISOString()
        });
        toast({
          title: "Connection Failed",
          description: data.error || "Could not connect to GP51 platform",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('GP51 connection test failed:', error);
      setConnectionStatus({
        connected: false,
        error: error.message || 'Connection test failed',
        lastCheck: new Date().toISOString()
      });
      toast({
        title: "Connection Error",
        description: "Failed to test GP51 connection",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    connectionStatus,
    isLoading,
    checkConnection
  };
};
