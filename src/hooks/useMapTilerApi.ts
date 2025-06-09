
import { useState, useEffect } from 'react';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import { googleMapsGeocodingService } from '@/services/googleMaps/googleMapsGeocodingService';
import { unifiedGeocodingService } from '@/services/geocoding/unifiedGeocodingService';
import { useToast } from '@/hooks/use-toast';

export interface GeocodingApiConfig {
  mapTiler: {
    apiKey: string | null;
    isConfigured: boolean;
  };
  googleMaps: {
    apiKey: string | null;
    isConfigured: boolean;
  };
  isLoading: boolean;
}

export const useMapTilerApi = () => {
  const [config, setConfig] = useState<GeocodingApiConfig>({
    mapTiler: {
      apiKey: null,
      isConfigured: false,
    },
    googleMaps: {
      apiKey: null,
      isConfigured: false,
    },
    isLoading: true
  });
  const { toast } = useToast();

  useEffect(() => {
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Initialize both services
      await unifiedGeocodingService.initialize();
      
      // Update config state based on current service status
      setConfig({
        mapTiler: {
          apiKey: mapTilerService.getApiKey(),
          isConfigured: mapTilerService.isConfigured()
        },
        googleMaps: {
          apiKey: googleMapsGeocodingService.getApiKey(),
          isConfigured: googleMapsGeocodingService.isConfigured()
        },
        isLoading: false
      });

      console.log('Geocoding services initialized successfully');
    } catch (error) {
      console.error('Failed to initialize geocoding services:', error);
      setConfig(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  const setMapTilerApiKey = (apiKey: string) => {
    mapTilerService.setApiKey(apiKey);
    setConfig(prev => ({
      ...prev,
      mapTiler: {
        apiKey,
        isConfigured: !!apiKey
      }
    }));
    
    toast({
      title: 'MapTiler API Key Set',
      description: 'MapTiler integration is now configured'
    });
  };

  const setGoogleMapsApiKey = (apiKey: string) => {
    googleMapsGeocodingService.setApiKey(apiKey);
    setConfig(prev => ({
      ...prev,
      googleMaps: {
        apiKey,
        isConfigured: !!apiKey
      }
    }));
    
    toast({
      title: 'Google Maps API Key Set',
      description: 'Google Maps geocoding is now configured'
    });
  };

  const testConnection = async (provider?: 'maptiler' | 'google-maps') => {
    try {
      if (provider === 'maptiler') {
        if (!config.mapTiler.isConfigured) {
          toast({
            title: 'No MapTiler API Key',
            description: 'Please set your MapTiler API key first',
            variant: 'destructive'
          });
          return false;
        }
        
        await mapTilerService.testConnection();
        toast({
          title: 'MapTiler Connection Successful',
          description: 'MapTiler API is working correctly'
        });
        return true;
      } else if (provider === 'google-maps') {
        if (!config.googleMaps.isConfigured) {
          toast({
            title: 'No Google Maps API Key',
            description: 'Please set your Google Maps API key first',
            variant: 'destructive'
          });
          return false;
        }
        
        await googleMapsGeocodingService.testConnection();
        toast({
          title: 'Google Maps Connection Successful',
          description: 'Google Maps API is working correctly'
        });
        return true;
      } else {
        // Test all configured providers
        const results = await unifiedGeocodingService.testConnection();
        const successCount = Object.values(results).filter(Boolean).length;
        const totalCount = Object.keys(results).length;
        
        if (successCount > 0) {
          toast({
            title: 'Connection Test Results',
            description: `${successCount}/${totalCount} geocoding providers are working`
          });
          return true;
        } else {
          toast({
            title: 'All Connections Failed',
            description: 'No geocoding providers are working',
            variant: 'destructive'
          });
          return false;
        }
      }
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

  const clearCache = () => {
    unifiedGeocodingService.clearAllCaches();
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
    reverseGeocode: unifiedGeocodingService.reverseGeocode.bind(unifiedGeocodingService),
    clearCache,
    getMetrics: unifiedGeocodingService.getMetrics.bind(unifiedGeocodingService),
    getCacheStats: unifiedGeocodingService.getCacheStats.bind(unifiedGeocodingService)
  };
};
