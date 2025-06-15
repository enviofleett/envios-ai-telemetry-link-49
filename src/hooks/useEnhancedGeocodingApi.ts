import { useState, useEffect } from 'react';
import { enhancedUnifiedGeocodingService } from '@/services/geocoding/enhancedUnifiedGeocodingService';
import { databaseGeocodingService } from '@/services/geocoding/databaseGeocodingService';
import { useToast } from '@/hooks/use-toast';

export interface EnhancedGeocodingApiConfig {
  mapTiler: {
    isConfigured: boolean;
  };
  googleMaps: {
    isConfigured: boolean;
  };
  isLoading: boolean;
  statistics: any;
}

export const useEnhancedGeocodingApi = () => {
  const [config, setConfig] = useState<EnhancedGeocodingApiConfig>({
    mapTiler: {
      isConfigured: false,
    },
    googleMaps: {
      isConfigured: false,
    },
    isLoading: true,
    statistics: null
  });
  const { toast } = useToast();

  useEffect(() => {
    initializeServices();
    loadStatistics();
  }, []);

  const initializeServices = async () => {
    try {
      await enhancedUnifiedGeocodingService.initialize();
      
      // Load configuration from database
      const [mapTilerConfig, googleMapsConfig] = await Promise.all([
        databaseGeocodingService.getGeocodingConfiguration('maptiler'),
        databaseGeocodingService.getGeocodingConfiguration('google-maps')
      ]);

      setConfig(prev => ({
        ...prev,
        mapTiler: {
          isConfigured: !!mapTilerConfig?.api_key_encrypted
        },
        googleMaps: {
          isConfigured: !!googleMapsConfig?.api_key_encrypted
        },
        isLoading: false
      }));

      console.log('Enhanced geocoding services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize enhanced geocoding services:', error);
      setConfig(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await databaseGeocodingService.getGeocodingStatistics();
      setConfig(prev => ({
        ...prev,
        statistics: stats
      }));
    } catch (error) {
      console.error('Failed to load geocoding statistics:', error);
    }
  };

  const setMapTilerApiKey = async (apiKey: string) => {
    try {
      const success = await enhancedUnifiedGeocodingService.saveProviderConfiguration(
        'maptiler', 
        apiKey, 
        !config.googleMaps.isConfigured // Set as primary if Google Maps is not configured
      );

      if (success) {
        setConfig(prev => ({
          ...prev,
          mapTiler: {
            isConfigured: true
          }
        }));
        
        toast({
          title: 'MapTiler API Key Saved',
          description: 'MapTiler configuration has been securely saved.'
        });

        // Reload statistics
        await loadStatistics();
      } else {
        toast({
          title: 'Failed to Save API Key',
          description: 'Could not save MapTiler API key to database',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error setting MapTiler API key:', error);
      toast({
        title: 'Configuration Error',
        description: 'An error occurred while configuring MapTiler',
        variant: 'destructive'
      });
    }
  };

  const setGoogleMapsApiKey = async (apiKey: string) => {
    try {
      const success = await enhancedUnifiedGeocodingService.saveProviderConfiguration(
        'google-maps', 
        apiKey, 
        true // Set Google Maps as primary by default
      );

      if (success) {
        setConfig(prev => ({
          ...prev,
          googleMaps: {
            isConfigured: true
          }
        }));
        
        toast({
          title: 'Google Maps API Key Saved',
          description: 'Google Maps configuration has been securely saved.'
        });

        // Reload statistics
        await loadStatistics();
      } else {
        toast({
          title: 'Failed to Save API Key',
          description: 'Could not save Google Maps API key to database',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error setting Google Maps API key:', error);
      toast({
        title: 'Configuration Error',
        description: 'An error occurred while configuring Google Maps',
        variant: 'destructive'
      });
    }
  };

  const testConnection = async (provider?: 'maptiler' | 'google-maps') => {
    try {
      const results = await enhancedUnifiedGeocodingService.testConnection(provider);
      const successCount = Object.values(results).filter(Boolean).length;
      const totalCount = Object.keys(results).length;
      
      if (provider) {
        const isSuccess = results[provider];
        const providerName = provider === 'google-maps' ? 'Google Maps' : 'MapTiler';
        
        toast({
          title: isSuccess ? `${providerName} Connection Successful` : `${providerName} Connection Failed`,
          description: isSuccess ? 
            `${providerName} API is working correctly` : 
            `Failed to connect to ${providerName} API`,
          variant: isSuccess ? 'default' : 'destructive'
        });
      } else {
        toast({
          title: 'Connection Test Results',
          description: `${successCount}/${totalCount} geocoding providers are working`
        });
      }

      return results;
    } catch (error) {
      const providerName = provider === 'google-maps' ? 'Google Maps' : 
                          provider === 'maptiler' ? 'MapTiler' : 'Geocoding';
      toast({
        title: `${providerName} Connection Failed`,
        description: error instanceof Error ? error.message : 'Connection test failed',
        variant: 'destructive'
      });
      return false;
    }
  };

  const clearCache = async () => {
    await enhancedUnifiedGeocodingService.clearAllCaches();
    toast({
      title: 'Cache Cleared',
      description: 'All geocoding caches have been cleared'
    });
  };

  return {
    config,
    setMapTilerApiKey,
    setGoogleMapsApiKey,
    testConnection,
    reverseGeocode: enhancedUnifiedGeocodingService.reverseGeocode.bind(enhancedUnifiedGeocodingService),
    clearCache,
    getMetrics: enhancedUnifiedGeocodingService.getMetrics.bind(enhancedUnifiedGeocodingService),
    getCacheStats: enhancedUnifiedGeocodingService.getCacheStats.bind(enhancedUnifiedGeocodingService),
    loadStatistics
  };
};
