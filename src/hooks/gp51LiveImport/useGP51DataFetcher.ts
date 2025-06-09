
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GP51LiveData, GP51ConnectionStatus } from './types';
import { calculateStatistics } from './utils';

export const useGP51DataFetcher = (connectionStatus: GP51ConnectionStatus | null) => {
  const [liveData, setLiveData] = useState<GP51LiveData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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

      const statistics = calculateStatistics(users, devices);

      const fetchedData: GP51LiveData = {
        users,
        devices,
        groups,
        statistics
      };

      setLiveData(fetchedData);

      toast({
        title: "Data Fetched Successfully",
        description: `Found ${users.length} users and ${devices.length} devices`
      });

      return fetchedData;
    } catch (error) {
      console.error('Failed to fetch GP51 live data:', error);
      toast({
        title: "Data Fetch Failed",
        description: error.message || "Could not fetch data from GP51",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connectionStatus, toast]);

  return {
    liveData,
    isLoading,
    fetchLiveData,
    setLiveData
  };
};
