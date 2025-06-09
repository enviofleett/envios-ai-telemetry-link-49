
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface GP51ConnectionStatus {
  connected: boolean;
  username?: string;
  apiUrl?: string;
  lastCheck?: string;
  error?: string;
}

export interface GP51LiveData {
  users: GP51User[];
  devices: GP51Device[];
  groups: GP51Group[];
  statistics: {
    totalUsers: number;
    totalDevices: number;
    activeUsers: number;
    activeDevices: number;
  };
}

export interface GP51User {
  username: string;
  usertype: number;
  usertypename: string;
  remark: string;
  phone: string;
  creater: string;
  createtime: number;
  lastactivetime: number;
  groupids: number[];
  deviceids: string[];
}

export interface GP51Device {
  deviceid: string;
  devicename: string;
  devicetype: number;
  simnum: string;
  overduetime: number;
  expirenotifytime: number;
  remark: string;
  creater: string;
  videochannelcount: number;
  lastactivetime: number;
  isfree: number;
  allowedit: number;
  icon: number;
  stared: number;
  loginame: string;
}

export interface GP51Group {
  groupid: number;
  groupname: string;
  remark: string;
  devices: GP51Device[];
}

export interface GP51LiveImportConfig {
  importUsers: boolean;
  importDevices: boolean;
  userTypes: number[];
  deviceTypes: number[];
  dateRange: {
    from: Date;
    to: Date;
  };
  conflictResolution: 'skip' | 'update' | 'merge';
  selectedUserIds: string[];
  selectedDeviceIds: string[];
}

export interface GP51LiveImportJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  startedAt: string;
  completedAt?: string;
  results: {
    users: { created: number; updated: number; failed: number };
    devices: { created: number; updated: number; failed: number };
  };
  errors: string[];
}

export const useGP51LiveImport = () => {
  const [connectionStatus, setConnectionStatus] = useState<GP51ConnectionStatus | null>(null);
  const [liveData, setLiveData] = useState<GP51LiveData | null>(null);
  const [importConfig, setImportConfig] = useState<GP51LiveImportConfig>({
    importUsers: true,
    importDevices: true,
    userTypes: [1, 2, 3, 4], // All user types by default
    deviceTypes: [],
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date()
    },
    conflictResolution: 'update',
    selectedUserIds: [],
    selectedDeviceIds: []
  });
  const [importJob, setImportJob] = useState<GP51LiveImportJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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

  const fetchLiveData = useCallback(async () => {
    if (!connectionStatus?.connected) {
      toast({
        title: "Connection Required",
        description: "Please establish GP51 connection first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching live data from GP51...');

      // Fetch users and devices in parallel
      const [usersResponse, devicesResponse] = await Promise.all([
        supabase.functions.invoke('gp51-service-management', {
          body: { action: 'queryallusers' }
        }),
        supabase.functions.invoke('gp51-service-management', {
          body: { action: 'querymonitorlist' }
        })
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (devicesResponse.error) throw devicesResponse.error;

      const users = usersResponse.data?.users || [];
      const groups = devicesResponse.data?.groups || [];
      const devices = groups.flatMap(group => group.devices || []);

      const statistics = {
        totalUsers: users.length,
        totalDevices: devices.length,
        activeUsers: users.filter(u => u.lastactivetime > Date.now() - 30 * 24 * 60 * 60 * 1000).length,
        activeDevices: devices.filter(d => d.lastactivetime > Date.now() - 30 * 24 * 60 * 60 * 1000).length
      };

      const fetchedData: GP51LiveData = {
        users,
        devices,
        groups,
        statistics
      };

      setLiveData(fetchedData);
      
      // Update config with all available IDs by default
      setImportConfig(prev => ({
        ...prev,
        selectedUserIds: users.map(u => u.username),
        selectedDeviceIds: devices.map(d => d.deviceid),
        deviceTypes: [...new Set(devices.map(d => d.devicetype))]
      }));

      toast({
        title: "Data Fetched Successfully",
        description: `Found ${users.length} users and ${devices.length} devices`
      });

    } catch (error) {
      console.error('Failed to fetch GP51 live data:', error);
      toast({
        title: "Data Fetch Failed",
        description: error.message || "Could not fetch data from GP51",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [connectionStatus, toast]);

  const updateImportConfig = useCallback((config: Partial<GP51LiveImportConfig>) => {
    setImportConfig(prev => ({ ...prev, ...config }));
  }, []);

  const startImport = useCallback(async () => {
    if (!liveData || !importConfig) {
      toast({
        title: "Import Error",
        description: "No data or configuration available for import",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsImporting(true);
      console.log('Starting GP51 live data import...');

      // Create import job
      const { data: jobData, error: jobError } = await supabase.functions.invoke('gp51-live-import', {
        body: {
          action: 'start_import',
          liveData,
          importConfig
        }
      });

      if (jobError) throw jobError;

      setImportJob(jobData.job);

      toast({
        title: "Import Started",
        description: "GP51 live data import has been initiated"
      });

      // Poll for progress updates
      const pollProgress = async () => {
        try {
          const { data: progressData } = await supabase.functions.invoke('gp51-live-import', {
            body: {
              action: 'get_progress',
              jobId: jobData.job.id
            }
          });

          if (progressData?.job) {
            setImportJob(progressData.job);
            
            if (progressData.job.status === 'completed' || progressData.job.status === 'failed') {
              setIsImporting(false);
              toast({
                title: progressData.job.status === 'completed' ? "Import Completed" : "Import Failed",
                description: progressData.job.status === 'completed' 
                  ? `Successfully imported ${progressData.job.successfulItems} items`
                  : `Import failed after processing ${progressData.job.processedItems} items`,
                variant: progressData.job.status === 'failed' ? "destructive" : "default"
              });
              return;
            }
          }

          // Continue polling if still processing
          setTimeout(pollProgress, 2000);
        } catch (error) {
          console.error('Failed to poll import progress:', error);
        }
      };

      // Start polling after a short delay
      setTimeout(pollProgress, 1000);

    } catch (error) {
      console.error('Failed to start GP51 import:', error);
      setIsImporting(false);
      toast({
        title: "Import Failed",
        description: error.message || "Could not start import process",
        variant: "destructive"
      });
    }
  }, [liveData, importConfig, toast]);

  const clearData = useCallback(() => {
    setLiveData(null);
    setImportJob(null);
    setImportConfig({
      importUsers: true,
      importDevices: true,
      userTypes: [1, 2, 3, 4],
      deviceTypes: [],
      dateRange: {
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        to: new Date()
      },
      conflictResolution: 'update',
      selectedUserIds: [],
      selectedDeviceIds: []
    });
    setIsImporting(false);
  }, []);

  return {
    connectionStatus,
    liveData,
    importConfig,
    importJob,
    isLoading,
    isImporting,
    checkConnection,
    fetchLiveData,
    updateImportConfig,
    startImport,
    clearData
  };
};
