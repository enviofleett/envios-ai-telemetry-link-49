
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  gp51_group_id?: number;
  color_code?: string;
  created_at: string;
  updated_at: string;
}

export const useDeviceGroups = () => {
  const query = useQuery({
    queryKey: ['device-groups'],
    queryFn: async (): Promise<DeviceGroup[]> => {
      const { data, error } = await supabase
        .from('device_groups')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching device groups:', error);
        throw error;
      }

      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};

export const useGroupManagement = () => {
  const deviceGroupsQuery = useDeviceGroups();

  return {
    deviceGroups: deviceGroupsQuery.data,
    isLoadingGroups: deviceGroupsQuery.isLoading,
    groupsError: deviceGroupsQuery.error,
    refetchGroups: deviceGroupsQuery.refetch
  };
};
