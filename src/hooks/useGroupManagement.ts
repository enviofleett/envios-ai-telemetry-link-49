
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { gp51UserApi } from '@/services/gp51UserManagementApi';
import { gp51VehicleGroupApi } from '@/services/gp51VehicleGroupManagementApi';
import { toast } from 'sonner';

export interface UserGroup {
  id: string;
  gp51_group_id: number;
  name: string;
  description?: string;
  parent_group_id?: string;
  created_at: string;
  updated_at: string;
}

export interface UserGroupAssignment {
  id: string;
  user_id: string;
  user_group_id: string;
  assigned_at: string;
  assigned_by?: string;
  user_group: UserGroup;
}

export interface DeviceGroupAssignment {
  id: string;
  device_id: string;
  device_group_id: string;
  assigned_at: string;
  assigned_by?: string;
  device_group: {
    id: string;
    name: string;
    gp51_group_id?: number;
  };
}

export function useUserGroups() {
  return useQuery({
    queryKey: ['user-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_groups')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as UserGroup[];
    }
  });
}

export function useDeviceGroups() {
  return useQuery({
    queryKey: ['device-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('device_groups')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });
}

export function useUserGroupAssignments(userId?: string) {
  return useQuery({
    queryKey: ['user-group-assignments', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_group_assignments')
        .select(`
          *,
          user_group:user_groups(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data as UserGroupAssignment[];
    },
    enabled: !!userId
  });
}

export function useDeviceGroupAssignments(deviceId?: string) {
  return useQuery({
    queryKey: ['device-group-assignments', deviceId],
    queryFn: async () => {
      if (!deviceId) return [];

      const { data, error } = await supabase
        .from('device_group_assignments')
        .select(`
          *,
          device_group:device_groups(*)
        `)
        .eq('device_id', deviceId);

      if (error) throw error;
      return data as DeviceGroupAssignment[];
    },
    enabled: !!deviceId
  });
}

export function useGroupManagement() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const assignUserToGroup = useMutation({
    mutationFn: async ({ username, groupId }: { username: string; groupId: number }) => {
      setIsLoading(true);
      try {
        const response = await gp51UserApi.assignUserToGroup(username, groupId);
        if (response.status !== 0) {
          throw new Error(response.cause || 'Failed to assign user to group');
        }
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-group-assignments'] });
      toast.success('User assigned to group successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to assign user to group:', error);
      toast.error(`Failed to assign user to group: ${error.message}`);
    }
  });

  const removeUserFromGroup = useMutation({
    mutationFn: async ({ username, groupId }: { username: string; groupId: number }) => {
      setIsLoading(true);
      try {
        const response = await gp51UserApi.removeUserFromGroup(username, groupId);
        if (response.status !== 0) {
          throw new Error(response.cause || 'Failed to remove user from group');
        }
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-group-assignments'] });
      toast.success('User removed from group successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to remove user from group:', error);
      toast.error(`Failed to remove user from group: ${error.message}`);
    }
  });

  const assignVehicleToGroup = useMutation({
    mutationFn: async ({ deviceId, groupId }: { deviceId: string; groupId: number }) => {
      setIsLoading(true);
      try {
        const response = await gp51VehicleGroupApi.assignVehicleToGroup(deviceId, groupId);
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-group-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle assigned to group successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to assign vehicle to group:', error);
      toast.error(`Failed to assign vehicle to group: ${error.message}`);
    }
  });

  const removeVehicleFromGroup = useMutation({
    mutationFn: async ({ deviceId, groupId }: { deviceId: string; groupId: number }) => {
      setIsLoading(true);
      try {
        const response = await gp51VehicleGroupApi.removeVehicleFromGroup(deviceId, groupId);
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-group-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle removed from group successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to remove vehicle from group:', error);
      toast.error(`Failed to remove vehicle from group: ${error.message}`);
    }
  });

  const createUserGroup = useMutation({
    mutationFn: async ({ name, description, parentGroupId }: { name: string; description?: string; parentGroupId?: number }) => {
      setIsLoading(true);
      try {
        const response = await gp51VehicleGroupApi.createGroup(name, description, parentGroupId);
        return response;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ queryKey: ['device-groups'] });
      toast.success('Group created successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to create group:', error);
      toast.error(`Failed to create group: ${error.message}`);
    }
  });

  return {
    assignUserToGroup,
    removeUserFromGroup,
    assignVehicleToGroup,
    removeVehicleFromGroup,
    createUserGroup,
    isLoading
  };
}
