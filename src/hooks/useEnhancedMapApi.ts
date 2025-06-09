
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapConfig, isMapConfig } from '@/types/mapProviders';
import { useToast } from '@/hooks/use-toast';

export const useEnhancedMapApi = () => {
  const [currentProvider, setCurrentProvider] = useState<MapConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<string>('healthy');
  const { toast } = useToast();

  const fetchBestProvider = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the unified edge function
      const { data, error } = await supabase.functions.invoke('map-management', {
        body: { action: 'get-best-provider' }
      });

      if (error) {
        console.error('Error fetching best provider:', error);
        throw error;
      }

      if (!data?.provider) {
        setError('No active map providers configured');
        return;
      }

      const provider = data.provider;
      
      // Validate the provider data
      if (!isMapConfig(provider)) {
        console.error('Invalid provider data structure:', provider);
        setError('Invalid provider configuration');
        return;
      }

      setCurrentProvider(provider);
      setHealthStatus(provider.health_status || 'healthy');

      // Increment usage counter
      await supabase.functions.invoke('map-management', {
        body: { 
          action: 'increment-usage',
          configId: provider.id
        }
      });

    } catch (err) {
      console.error('Error in fetchBestProvider:', err);
      setError('Failed to load map provider configuration');
      toast({
        title: 'Map Provider Error',
        description: 'Unable to load map configuration. Please check your settings.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const logHealthCheck = useCallback(async (
    configId: string,
    status: string,
    responseTime?: number,
    errorMessage?: string
  ) => {
    try {
      await supabase.functions.invoke('map-management', {
        body: {
          action: 'health-check',
          configId,
          status,
          responseTime,
          errorMessage
        }
      });
      
      setHealthStatus(status);
    } catch (error) {
      console.error('Error logging health check:', error);
    }
  }, []);

  const logFailover = useCallback(async (
    fromConfigId: string,
    toConfigId: string,
    reason: string
  ) => {
    try {
      await supabase.functions.invoke('map-management', {
        body: {
          action: 'log-failover',
          fromConfigId,
          toConfigId,
          reason
        }
      });
      
      toast({
        title: 'Map Provider Switched',
        description: `Switched to backup provider due to: ${reason}`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error logging failover:', error);
    }
  }, [toast]);

  const performHealthCheck = useCallback(async (config: MapConfig) => {
    const startTime = Date.now();
    
    try {
      const testUrl = getHealthCheckUrl(config);
      if (!testUrl) {
        await logHealthCheck(config.id, 'failed', 0, 'Unsupported provider type');
        return { healthy: false, responseTime: 0, error: 'Unsupported provider type' };
      }

      const response = await fetch(testUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        await logHealthCheck(config.id, 'healthy', responseTime);
        return { healthy: true, responseTime };
      } else {
        await logHealthCheck(config.id, 'degraded', responseTime, `HTTP ${response.status}`);
        return { healthy: false, responseTime, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await logHealthCheck(config.id, 'failed', responseTime, errorMessage);
      return { healthy: false, responseTime, error: errorMessage };
    }
  }, [logHealthCheck]);

  const getHealthCheckUrl = (config: MapConfig): string => {
    switch (config.provider_type) {
      case 'maptiler':
        return `https://api.maptiler.com/maps/streets/style.json?key=${config.api_key}`;
      case 'mapbox':
        return `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${config.api_key}`;
      default:
        return '';
    }
  };

  const switchToFallbackProvider = useCallback(async (currentConfigId: string, reason: string) => {
    try {
      // Get next available provider
      const { data, error } = await supabase.functions.invoke('map-management', {
        body: { 
          action: 'get-fallback-provider',
          excludeConfigId: currentConfigId
        }
      });

      if (error || !data?.provider) {
        throw new Error('No fallback providers available');
      }

      const fallbackProvider = data.provider;
      
      // Validate the fallback provider
      if (!isMapConfig(fallbackProvider)) {
        throw new Error('Invalid fallback provider configuration');
      }
      
      // Log the failover
      await logFailover(currentConfigId, fallbackProvider.id, reason);
      
      // Update current provider
      setCurrentProvider(fallbackProvider);
      
      return fallbackProvider;
    } catch (error) {
      console.error('Error switching to fallback provider:', error);
      toast({
        title: 'Failover Failed',
        description: 'Unable to switch to backup map provider.',
        variant: 'destructive'
      });
      throw error;
    }
  }, [logFailover, toast]);

  useEffect(() => {
    fetchBestProvider();

    // Set up periodic health checks
    const healthCheckInterval = setInterval(async () => {
      if (currentProvider) {
        const result = await performHealthCheck(currentProvider);
        
        // If health check fails, try to switch to fallback
        if (!result.healthy && healthStatus !== 'failed') {
          try {
            await switchToFallbackProvider(currentProvider.id, result.error || 'Health check failed');
          } catch (error) {
            console.error('Automatic failover failed:', error);
          }
        }
      }
    }, 60000); // Check every minute

    return () => {
      clearInterval(healthCheckInterval);
    };
  }, [fetchBestProvider, currentProvider, performHealthCheck, switchToFallbackProvider, healthStatus]);

  return {
    currentProvider,
    isLoading,
    error,
    healthStatus,
    refetch: fetchBestProvider,
    performHealthCheck,
    switchToFallbackProvider,
    logHealthCheck,
    logFailover
  };
};
