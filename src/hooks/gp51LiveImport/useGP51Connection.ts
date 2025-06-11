
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
      console.log('🧪 Testing real-time GP51 API connectivity...');

      // Test real GP51 API with live data fetch
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
        console.log('✅ Real-time GP51 API test successful');
        
        // Now test live data fetch to verify full connectivity
        const liveDataTest = await supabase.functions.invoke('fetchLiveGp51Data', {
          body: {}
        });

        let deviceCount = data.deviceCount || 0;
        let lastDataFetch = null;

        if (liveDataTest.data && liveDataTest.data.success) {
          deviceCount = liveDataTest.data.data?.total_devices || deviceCount;
          lastDataFetch = liveDataTest.data.data?.fetched_at;
          console.log('✅ Live data fetch successful');
        }

        setConnectionStatus({
          connected: true,
          username: data.username,
          apiUrl: data.apiUrl,
          lastCheck: new Date().toISOString(),
          deviceCount,
          lastDataFetch,
          realTimeStatus: 'online'
        });
        
        toast({
          title: "Connection Successful",
          description: `Connected to GP51 API as ${data.username} (${deviceCount} devices online)`
        });
      } else {
        console.error('❌ GP51 API test failed:', data);
        setConnectionStatus({
          connected: false,
          error: data.details || data.error || 'GP51 API test failed',
          lastCheck: new Date().toISOString(),
          realTimeStatus: 'offline'
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
        lastCheck: new Date().toISOString(),
        realTimeStatus: 'error'
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
        
        // Update connection status to show data fetch failed
        setConnectionStatus(prev => prev ? {
          ...prev,
          realTimeStatus: 'error',
          error: error.message,
          lastCheck: new Date().toISOString()
        } : null);
        
        throw new Error(error.message || 'Failed to fetch live data');
      }

      if (!data.success) {
        console.error('❌ Live data fetch failed:', data);
        
        setConnectionStatus(prev => prev ? {
          ...prev,
          realTimeStatus: 'offline',
          error: data.details || data.error,
          lastCheck: new Date().toISOString()
        } : null);
        
        throw new Error(data.details || data.error || 'Live data fetch failed');
      }

      console.log('✅ Live data fetched successfully:', data);
      
      // Update connection status with successful live data fetch
      setConnectionStatus(prev => prev ? {
        ...prev,
        realTimeStatus: 'online',
        deviceCount: data.data.total_devices,
        lastDataFetch: data.data.fetched_at,
        lastCheck: new Date().toISOString(),
        error: undefined
      } : null);
      
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
