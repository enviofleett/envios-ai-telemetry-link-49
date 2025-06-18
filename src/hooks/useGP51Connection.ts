import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { healthMonitoringService } from '@/services/gp51/healthMonitoringService';

export interface GP51ConnectionStatus {
  connected: boolean;
  username?: string;
  apiUrl?: string;
  lastCheck?: string;
  deviceCount?: number;
  lastDataFetch?: string;
  error?: string;
  realTimeStatus?: 'online' | 'offline' | 'error';
}

export const useGP51Connection = () => {
  const [connectionStatus, setConnectionStatus] = useState<GP51ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      setIsLoading(true);
      console.log('🧪 Testing enhanced GP51 API connectivity...');

      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_gp51_api' }
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        console.error('❌ Enhanced API test error:', error);
        
        // Record health check failure
        healthMonitoringService.recordHealthCheck(false, responseTime, error.message);
        
        setConnectionStatus({
          connected: false,
          error: error.message || 'Failed to test GP51 API',
          lastCheck: new Date().toISOString(),
          realTimeStatus: 'error'
        });
        
        toast({
          title: "Connection Test Failed",
          description: "Failed to test GP51 API connection",
          variant: "destructive"
        });
        return;
      }

      if (data.success) {
        console.log('✅ Enhanced GP51 API test successful');
        
        // Record successful health check
        healthMonitoringService.recordHealthCheck(true, responseTime);
        
        // Test live data fetch
        const liveDataTest = await supabase.functions.invoke('fetchLiveGp51Data', {
          body: {}
        });

        let deviceCount = data.deviceCount || 0;
        let lastDataFetch = null;

        if (liveDataTest.data && liveDataTest.data.success) {
          deviceCount = liveDataTest.data.data?.total_devices || deviceCount;
          lastDataFetch = liveDataTest.data.data?.fetched_at;
          console.log('✅ Enhanced live data fetch successful');
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
          description: `Connected to GP51 API as ${data.username} (${deviceCount} devices)`
        });
      } else {
        console.error('❌ Enhanced GP51 API test failed:', data);
        
        // Record health check failure
        healthMonitoringService.recordHealthCheck(false, responseTime, data.error);
        
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
      const responseTime = Date.now() - startTime;
      console.error('❌ Enhanced connection test exception:', error);
      
      // Record health check failure
      healthMonitoringService.recordHealthCheck(false, responseTime, error instanceof Error ? error.message : 'Unknown error');
      
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
    const startTime = Date.now();
    
    try {
      setIsLoading(true);
      console.log('📡 Fetching enhanced live data from GP51...');

      const { data, error } = await supabase.functions.invoke('fetchLiveGp51Data', {
        body: {}
      });

      const responseTime = Date.now() - startTime;

      if (error) {
        console.error('❌ Enhanced live data fetch error:', error);
        
        // Record health check failure
        healthMonitoringService.recordHealthCheck(false, responseTime, error.message);
        
        setConnectionStatus(prev => prev ? {
          ...prev,
          realTimeStatus: 'error',
          error: error.message,
          lastCheck: new Date().toISOString()
        } : null);
        
        throw new Error(error.message || 'Failed to fetch live data');
      }

      if (!data.success) {
        console.error('❌ Enhanced live data fetch failed:', data);
        
        // Record health check failure
        healthMonitoringService.recordHealthCheck(false, responseTime, data.details || data.error);
        
        setConnectionStatus(prev => prev ? {
          ...prev,
          realTimeStatus: 'offline',
          error: data.details || data.error,
          lastCheck: new Date().toISOString()
        } : null);
        
        throw new Error(data.details || data.error || 'Live data fetch failed');
      }

      console.log('✅ Enhanced live data fetched successfully:', data);
      
      // Record successful health check
      healthMonitoringService.recordHealthCheck(true, responseTime);
      
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
      console.error('❌ Enhanced live data fetch exception:', error);
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
