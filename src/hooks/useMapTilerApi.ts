
import { useState, useEffect } from 'react';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import { useToast } from '@/hooks/use-toast';

export interface MapTilerApiConfig {
  apiKey: string | null;
  isConfigured: boolean;
  isLoading: boolean;
}

export const useMapTilerApi = () => {
  const [config, setConfig] = useState<MapTilerApiConfig>({
    apiKey: null,
    isConfigured: false,
    isLoading: true
  });
  const { toast } = useToast();

  useEffect(() => {
    initializeMapTiler();
  }, []);

  const initializeMapTiler = async () => {
    try {
      await mapTilerService.initialize();
      setConfig(prev => ({
        ...prev,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to initialize MapTiler:', error);
      setConfig(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  const setApiKey = (apiKey: string) => {
    mapTilerService.setApiKey(apiKey);
    setConfig(prev => ({
      ...prev,
      apiKey,
      isConfigured: !!apiKey
    }));
    
    toast({
      title: 'MapTiler API Key Set',
      description: 'Map integration is now configured'
    });
  };

  const testConnection = async () => {
    if (!config.apiKey) {
      toast({
        title: 'No API Key',
        description: 'Please set your MapTiler API key first',
        variant: 'destructive'
      });
      return false;
    }

    try {
      // Test with a simple geocoding request
      const testAddress = await mapTilerService.reverseGeocode(40.7128, -74.0060);
      toast({
        title: 'Connection Successful',
        description: `MapTiler API is working. Test result: ${testAddress}`
      });
      return true;
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect to MapTiler API',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
    config,
    setApiKey,
    testConnection,
    reverseGeocode: mapTilerService.reverseGeocode.bind(mapTilerService),
    clearCache: mapTilerService.clearCache.bind(mapTilerService)
  };
};
