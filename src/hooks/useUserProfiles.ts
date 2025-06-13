
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface UserProfile {
  id: string;
  phone_number?: string;
  registration_status: 'pending_email_verification' | 'pending_phone_verification' | 'pending_admin_approval' | 'active' | 'rejected';
  role: 'admin' | 'user' | 'moderator' | 'driver' | 'dispatcher' | 'fleet_manager' | 'pending';
  company_id?: string;
  first_name?: string;
  last_name?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
  email?: string; // From auth.users
  vehicle_count?: number;
  assigned_vehicles?: Array<{
    id: string;
    device_id: string;
    device_name?: string;
    plate_number?: string;
  }>;
}

interface UseUserProfilesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

export const useUserProfiles = (params: UseUserProfilesParams = {}) => {
  const { page = 1, limit = 50, search = '', status = '', role = '' } = params;
  
  return useQuery({
    queryKey: ['user-profiles', page, limit, search, status, role],
    queryFn: async () => {
      let query = supabase
        .from('user_profiles')
        .select(`
          *,
          vehicles!vehicles_user_profile_id_fkey(
            id,
            device_id,
            device_name,
            plate_number
          )
        `);

      // Add search filter
      if (search.trim()) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_number.ilike.%${search}%`);
      }

      // Add status filter
      if (status) {
        query = query.eq('registration_status', status);
      }

      // Add role filter
      if (role) {
        query = query.eq('role', role);
      }

      // Add pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      // Get email addresses from auth.users for each profile
      const profileIds = data?.map(p => p.id) || [];
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      const emailMap = authUsers.users.reduce((acc, user) => {
        acc[user.id] = user.email;
        return acc;
      }, {} as Record<string, string>);

      const enhancedProfiles = (data || []).map(profile => ({
        ...profile,
        email: emailMap[profile.id] || '',
        vehicle_count: profile.vehicles?.length || 0,
        assigned_vehicles: profile.vehicles || []
      }));

      return {
        profiles: enhancedProfiles,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      };
    },
    staleTime: 30000,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { id: string; updates: Partial<UserProfile> }) => {
      const { error } = await supabase
        .from('user_profiles')
        .update(data.updates)
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: "Success",
        description: "User profile updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update user profile: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};

export const useAssignVehicleToUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { vehicleId: string; userId: string; reason?: string }) => {
      // First, update the vehicle to link to the user
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ user_profile_id: data.userId })
        .eq('id', data.vehicleId);

      if (vehicleError) throw vehicleError;

      // Then, create an assignment record for audit purposes
      const { error: assignmentError } = await supabase
        .from('vehicle_assignments')
        .insert({
          vehicle_id: data.vehicleId,
          user_profile_id: data.userId,
          assignment_reason: data.reason || 'Manual assignment by admin',
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (assignmentError) throw assignmentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: "Success",
        description: "Vehicle assigned successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to assign vehicle: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};

export const useUnassignVehicleFromUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { vehicleId: string; reason?: string }) => {
      // Get current assignment for audit
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('user_profile_id')
        .eq('id', data.vehicleId)
        .single();

      if (vehicle?.user_profile_id) {
        // Update assignment record
        await supabase
          .from('vehicle_assignments')
          .update({ 
            is_active: false, 
            unassigned_at: new Date().toISOString() 
          })
          .eq('vehicle_id', data.vehicleId)
          .eq('user_profile_id', vehicle.user_profile_id)
          .eq('is_active', true);
      }

      // Remove vehicle assignment
      const { error } = await supabase
        .from('vehicles')
        .update({ user_profile_id: null })
        .eq('id', data.vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: "Success",
        description: "Vehicle unassigned successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to unassign vehicle: ${error.message}`,
        variant: "destructive"
      });
    }
  });
};
