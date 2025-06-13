
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GP51LiveData {
  users: any[];
  vehicles: any[];
  devices: any[];
  statistics: {
    totalUsers: number;
    totalDevices: number;
    totalVehicles: number;
    activeDevices: number;
    activeUsers: number;
  };
  lastUpdate: string;
}

export interface GP51LiveImportConfig {
  batchSize: number;
  interval: number;
  autoStart: boolean;
  userTypes: string[];
  selectedUserIds: string[];
  selectedDeviceIds: string[];
  importUsers: boolean;
  importDevices: boolean;
  conflictResolution: string;
}

export interface GP51LiveImportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: GP51LiveImportConfig;
  startTime: string;
  endTime?: string;
  startedAt?: string;
  completedAt?: string;
  progress: number;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  results: {
    users: {
      created: number;
      updated: number;
      failed: number;
    };
    devices: {
      created: number;
      updated: number;
      failed: number;
    };
  };
  errors: any[];
}

export interface GP51ConnectionStatus {
  connected: boolean;
  lastCheck: Date;
  error?: string;
  username?: string;
  needsConfiguration?: boolean;
}

export const useGP51LiveImport = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<GP51LiveData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<GP51ConnectionStatus | null>(null);
  const { toast } = useToast();

  const checkConnection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: result, error: funcError } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      const status: GP51ConnectionStatus = {
        connected: result.isValid || false,
        lastCheck: new Date(),
        error: result.errorMessage,
        username: result.username,
        needsConfiguration: result.status === 'not_configured'
      };

      setConnectionStatus(status);
      setIsConnected(status.connected);

      if (status.needsConfiguration) {
        setError('GP51 integration not configured. Please add GP51 credentials in admin settings.');
        toast({
          title: "GP51 Not Configured",
          description: "Please configure GP51 credentials in the admin settings to use this feature.",
          variant: "destructive"
        });
      } else if (!status.connected && status.error) {
        setError(status.error);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection check failed';
      setError(errorMessage);
      setConnectionStatus({
        connected: false,
        lastCheck: new Date(),
        error: errorMessage
      });
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchLiveData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: result, error: funcError } = await supabase.functions.invoke('gp51-live-import');

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (!result.success) {
        if (result.code === 'NO_GP51_CONFIG') {
          setError('GP51 integration not configured. Please add GP51 credentials in admin settings.');
          toast({
            title: "GP51 Not Configured",
            description: "Please configure GP51 credentials in the admin settings to use this feature.",
            variant: "destructive"
          });
          return;
        }
        throw new Error(result.error || 'Failed to fetch live data');
      }

      const liveData: GP51LiveData = {
        users: result.data.devices || [],
        vehicles: result.data.positions || [],
        devices: result.data.devices || [],
        statistics: {
          totalUsers: result.data.total_devices || 0,
          totalDevices: result.data.total_devices || 0,
          totalVehicles: result.data.total_positions || 0,
          activeDevices: result.data.total_devices || 0,
          activeUsers: result.data.total_devices || 0,
        },
        lastUpdate: result.data.fetched_at || new Date().toISOString()
      };

      setData(liveData);
      toast({
        title: "Data Fetched Successfully",
        description: `Retrieved ${result.data.total_devices} devices and ${result.data.total_positions} positions`,
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch live data';
      setError(errorMessage);
      toast({
        title: "Fetch Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const startImport = useCallback(() => {
    if (!isConnected) {
      toast({
        title: "GP51 Not Connected",
        description: "Please check GP51 connection before starting import",
        variant: "destructive"
      });
      return;
    }
    setIsImporting(true);
    // Implementation would go here
  }, [isConnected, toast]);

  const stopImport = useCallback(() => {
    setIsImporting(false);
  }, []);

  const retry = useCallback(async () => {
    await checkConnection();
    if (isConnected) {
      await fetchLiveData();
    }
  }, [checkConnection, fetchLiveData, isConnected]);

  const clearData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  const updateImportConfig = useCallback((config: Partial<GP51LiveImportConfig>) => {
    // Implementation would go here
    console.log('Update import config:', config);
  }, []);

  return {
    isConnected,
    isImporting,
    isLoading,
    data,
    error,
    connectionStatus,
    liveData: data,
    importConfig: null as GP51LiveImportConfig | null,
    importJob: null as GP51LiveImportJob | null,
    startImport,
    stopImport,
    retry,
    checkConnection,
    fetchLiveData,
    updateImportConfig,
    clearData
  };
};

export default useGP51LiveImport;
