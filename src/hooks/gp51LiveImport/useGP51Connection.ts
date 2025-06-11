
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
      console.log('🧪 Testing real GP51 API connectivity...');

      // First test the real GP51 API using proper format
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_gp51_api' }
      });

      if (error) {
        console.error('❌ API test error:', error);
        setConnectionStatus({
          connected: false,
          error: error.message || 'Failed to test GP51 API',
          lastCheck: new Date().toISOString()
        });
        toast({
          title: "Connection Test Failed",
          description: "Failed to test GP51 API connection",
          variant: "destructive"
        });
        return;
      }

      if (data.success) {
        console.log('✅ GP51 API test successful');
        setConnectionStatus({
          connected: true,
          username: data.username,
          apiUrl: data.apiUrl,
          lastCheck: new Date().toISOString(),
          deviceCount: data.deviceCount
        });
        toast({
          title: "Connection Successful",
          description: `Connected to GP51 API as ${data.username} (${data.deviceCount} devices)`
        });
      } else {
        console.error('❌ GP51 API test failed:', data);
        setConnectionStatus({
          connected: false,
          error: data.details || data.error || 'GP51 API test failed',
          lastCheck: new Date().toISOString()
        });
        toast({
          title: "Connection Failed",
          description: data.details || "GP51 API is not responding correctly",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Connection test exception:', error);
      setConnectionStatus({
        connected: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
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

  const fetchLiveData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('📡 Fetching live data from GP51...');

      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: {}
      });

      if (error) {
        console.error('❌ Live data fetch error:', error);
        throw new Error(error.message || 'Failed to fetch live data');
      }

      if (!data.success) {
        console.error('❌ Live data fetch failed:', data);
        throw new Error(data.details || data.error || 'Live data fetch failed');
      }

      console.log('✅ Live data fetched successfully:', data);
      toast({
        title: "Live Data Fetched",
        description: `Successfully fetched data for ${data.data.total_positions} vehicles`
      });

      return data.data;
    } catch (error) {
      console.error('❌ Live data fetch exception:', error);
      toast({
        title: "Live Data Error",
        description: error instanceof Error ? error.message : 'Failed to fetch live data',
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    connectionStatus,
    isLoading,
    checkConnection,
    fetchLiveData
  };
};
