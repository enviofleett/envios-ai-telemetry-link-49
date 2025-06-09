
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapConfig, isMapConfig } from '@/types/mapProviders';

interface MapApiResponse {
  apiKey: string;
  providerType: string;
  configId: string;
}

export const useMapTilerApi = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveKey = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('map-management', {
        body: { action: 'get-active-key' }
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
        return;
      }

      setApiKey(data.apiKey);
      setConfigId(data.configId);

      // Increment usage for this API key
      if (data.configId) {
        await supabase.functions.invoke('map-management', {
          body: { 
            action: 'increment-usage',
            configId: data.configId
          }
        });
      }
    } catch (err) {
      console.error('Error fetching MapTiler API key:', err);
      setError('Failed to load map configuration');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveKey();
  }, []);

  return {
    apiKey,
    configId,
    isLoading,
    error,
    refetch: fetchActiveKey
  };
};

export const useMapConfigs = () => {
  const [configs, setConfigs] = useState<MapConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.functions.invoke('map-management', {
        body: { action: 'get-configs' }
      });

      if (error) throw error;

      if (data.error) {
        setError(data.error);
        return;
      }

      // Validate and filter configs
      const validConfigs = (data.configs || []).filter(isMapConfig);
      setConfigs(validConfigs);
    } catch (err) {
      console.error('Error fetching map configs:', err);
      setError('Failed to load map configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async (config: Partial<MapConfig>) => {
    try {
      const { data, error } = await supabase.functions.invoke('map-management', {
        body: { 
          action: 'save-config',
          ...config
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      await fetchConfigs();
      return data.config;
    } catch (err) {
      console.error('Error saving map config:', err);
      throw err;
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('map-management', {
        body: { 
          action: 'delete-config',
          id
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      await fetchConfigs();
    } catch (err) {
      console.error('Error deleting map config:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  return {
    configs,
    isLoading,
    error,
    saveConfig,
    deleteConfig,
    refetch: fetchConfigs
  };
};
