
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  phone_number: string;
  registration_status: 'pending_email_verification' | 'pending_phone_verification' | 'pending_admin_approval' | 'active' | 'rejected';
  role: 'admin' | 'user' | 'moderator' | 'agent' | 'merchant' | 'pending' | 'driver' | 'dispatcher' | 'fleet_manager' | 'manager' | 'compliance_officer';
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email: string;
  profile_picture_url?: string;
  vehicle_count: number;
  created_at: string;
  updated_at: string;
  assigned_vehicles: { id: string; device_id: string; device_name?: string; }[];
}

export const useUserProfiles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profiles with error handling
  const { data: profiles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-profiles', searchTerm],
    queryFn: async (): Promise<UserProfile[]> => {
      console.log('Fetching user profiles...');
      
      let query = supabase
        .from('user_profiles')
        .select(`
          id,
          phone_number,
          registration_status,
          role,
          first_name,
          last_name,
          created_at,
          updated_at,
          email,
          profile_picture_url
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone_number.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching user profiles:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Transform data and safely handle vehicle assignments
      return data.map(profile => {
        const fullName = profile.first_name && profile.last_name 
          ? `${profile.first_name} ${profile.last_name}` 
          : profile.first_name || profile.last_name || 'Unknown User';

        return {
          id: profile.id,
          phone_number: profile.phone_number || '',
          registration_status: profile.registration_status as UserProfile['registration_status'] || 'pending_email_verification',
          role: profile.role as UserProfile['role'] || 'pending',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          full_name: fullName,
          email: profile.email || '',
          profile_picture_url: profile.profile_picture_url || '',
          vehicle_count: 0, // Will be populated separately if needed
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          assigned_vehicles: [], // Will be fetched separately if needed
        };
      });
    },
    refetchInterval: 30000,
  });

  // Get vehicles assigned to a specific user
  const getUserVehicles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user vehicles:', error);
        return [];
      }

      return data?.map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        device_name: vehicle.name
      })) || [];

    } catch (error) {
      console.error('Error in getUserVehicles:', error);
      return [];
    }
  };

  // Assign vehicle to user
  const assignVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId, userId }: { vehicleId: string; userId: string }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: userId })
        .eq('id', vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vehicle assigned successfully' });
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: `Failed to assign vehicle: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Unassign vehicle from user
  const unassignVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId }: { vehicleId: string }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: null })
        .eq('id', vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Vehicle unassigned successfully' });
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: `Failed to unassign vehicle: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Update user profile
  const updateProfileMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<Pick<UserProfile, 'first_name' | 'last_name' | 'phone_number' | 'email' | 'role' | 'registration_status'>> }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Profile updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Error', 
        description: `Failed to update profile: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  return {
    profiles,
    isLoading,
    error: error?.message || null,
    refetch,
    searchTerm,
    setSearchTerm,
    getUserVehicles,
    assignVehicle: assignVehicleMutation.mutate,
    unassignVehicle: unassignVehicleMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    isAssigning: assignVehicleMutation.isPending,
    isUnassigning: unassignVehicleMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
  };
};

export const useAssignVehicleToUser = () => {
  const { assignVehicle, isAssigning } = useUserProfiles();
  return { mutate: assignVehicle, isPending: isAssigning };
};

export const useUnassignVehicleFromUser = () => {
  const { unassignVehicle, isUnassigning } = useUserProfiles();
  return { mutate: unassignVehicle, isPending: isUnassigning };
};
