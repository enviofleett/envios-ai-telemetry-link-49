
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
      // Since device_groups table doesn't exist, return empty array
      console.log('Device groups functionality not yet implemented - database tables missing');
      return [];
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

export const useUserGroups = () => {
  const query = useQuery({
    queryKey: ['user-groups'],
    queryFn: async (): Promise<UserGroup[]> => {
      // Since user_groups table doesn't exist, return empty array
      console.log('User groups functionality not yet implemented - database tables missing');
      return [];
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
      // Since device_group_assignments table doesn't exist, return empty array
      console.log('Device group assignments functionality not yet implemented - database tables missing');
      return [];
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
      // Since user_group_assignments table doesn't exist, return empty array
      console.log('User group assignments functionality not yet implemented - database tables missing');
      return [];
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
      // Placeholder implementation since tables don't exist
      throw new Error('Vehicle group assignment functionality is not yet implemented - database tables are missing');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-group-assignments'] });
    }
  });

  const removeVehicleFromGroup = useMutation({
    mutationFn: async ({ deviceId, groupId }: { deviceId: string; groupId: number }) => {
      // Placeholder implementation since tables don't exist
      throw new Error('Vehicle group removal functionality is not yet implemented - database tables are missing');
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
