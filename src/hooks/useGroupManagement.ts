
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { gp51VehicleGroupApi } from '@/services/gp51VehicleGroupManagementApi';

interface DeviceGroup {
  id: string;
  name: string;
  description?: string;
  gp51_group_id?: number;
  color_code?: string;
  created_at: string;
  updated_at: string;
}

interface UserGroup {
  id: string;
  name: string;
  description?: string;
  gp51_group_id: number;
  created_at: string;
  updated_at: string;
}

interface DeviceGroupAssignment {
  id: string;
  device_id: string;
  device_group_id: string;
  assigned_at: string;
  device_group: DeviceGroup;
}

interface UserGroupAssignment {
  id: string;
  user_id: string;
  user_group_id: string;
  assigned_at: string;
  user_group: UserGroup;
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

export const useUserGroups = () => {
  const query = useQuery({
    queryKey: ['user-groups'],
    queryFn: async (): Promise<UserGroup[]> => {
      const { data, error } = await supabase
        .from('user_groups')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching user groups:', error);
        throw error;
      }

      return data || [];
    },
    refetchInterval: 30000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};

export const useDeviceGroupAssignments = (deviceId: string) => {
  const query = useQuery({
    queryKey: ['device-group-assignments', deviceId],
    queryFn: async (): Promise<DeviceGroupAssignment[]> => {
      const { data, error } = await supabase
        .from('device_group_assignments')
        .select(`
          *,
          device_group:device_groups(*)
        `)
        .eq('device_id', deviceId);

      if (error) {
        console.error('Error fetching device group assignments:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!deviceId,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};

export const useUserGroupAssignments = (userId: string) => {
  const query = useQuery({
    queryKey: ['user-group-assignments', userId],
    queryFn: async (): Promise<UserGroupAssignment[]> => {
      const { data, error } = await supabase
        .from('user_group_assignments')
        .select(`
          *,
          user_group:user_groups(*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user group assignments:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!userId,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
};

export const useGroupManagement = () => {
  const queryClient = useQueryClient();
  const deviceGroupsQuery = useDeviceGroups();

  const assignVehicleToGroup = useMutation({
    mutationFn: async ({ deviceId, groupId }: { deviceId: string; groupId: number }) => {
      await gp51VehicleGroupApi.assignVehicleToGroup(deviceId, groupId);
      
      // Also create local assignment record
      const { error } = await supabase
        .from('device_group_assignments')
        .insert({
          device_id: deviceId,
          device_group_id: (await getLocalGroupByGP51Id(groupId))?.id
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-group-assignments'] });
    }
  });

  const removeVehicleFromGroup = useMutation({
    mutationFn: async ({ deviceId, groupId }: { deviceId: string; groupId: number }) => {
      await gp51VehicleGroupApi.removeVehicleFromGroup(deviceId, groupId);
      
      // Also remove local assignment record
      const localGroup = await getLocalGroupByGP51Id(groupId);
      if (localGroup) {
        const { error } = await supabase
          .from('device_group_assignments')
          .delete()
          .eq('device_id', deviceId)
          .eq('device_group_id', localGroup.id);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-group-assignments'] });
    }
  });

  const assignUserToGroup = useMutation({
    mutationFn: async ({ username, groupId }: { username: string; groupId: number }) => {
      // Use GP51 API to assign user to group
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'assignusertogroup',
          username,
          groupid: groupId
        }
      });

      if (error) throw error;
      if (data.status !== 0) throw new Error(data.cause || 'Failed to assign user to group');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-group-assignments'] });
    }
  });

  const removeUserFromGroup = useMutation({
    mutationFn: async ({ username, groupId }: { username: string; groupId: number }) => {
      // Use GP51 API to remove user from group
      const { data, error } = await supabase.functions.invoke('gp51-user-management', {
        body: {
          action: 'removeuserfromgroup',
          username,
          groupid: groupId
        }
      });

      if (error) throw error;
      if (data.status !== 0) throw new Error(data.cause || 'Failed to remove user from group');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-group-assignments'] });
    }
  });

  return {
    deviceGroups: deviceGroupsQuery.data,
    isLoadingGroups: deviceGroupsQuery.isLoading,
    groupsError: deviceGroupsQuery.error,
    refetchGroups: deviceGroupsQuery.refetch,
    assignVehicleToGroup,
    removeVehicleFromGroup,
    assignUserToGroup,
    removeUserFromGroup,
    isLoading: assignVehicleToGroup.isPending || 
               removeVehicleFromGroup.isPending || 
               assignUserToGroup.isPending || 
               removeUserFromGroup.isPending
  };
};

// Helper function to get local group by GP51 ID
async function getLocalGroupByGP51Id(gp51GroupId: number): Promise<{ id: string } | null> {
  try {
    const { data } = await supabase
      .from('device_groups')
      .select('id')
      .eq('gp51_group_id', gp51GroupId)
      .single();
    
    return data;
  } catch (error) {
    console.error('Failed to get local group by GP51 ID:', error);
    return null;
  }
}
