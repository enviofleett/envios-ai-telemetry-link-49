
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnvioUser {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  city: string | null;
  gp51_username: string | null;
  gp51_user_type: number;
  registration_status: string;
  created_at: string;
  updated_at: string;
}

interface VehicleData {
  device_id: string;
  device_name: string;
  status: string;
  created_at: string;
}

export const useOwnerManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all owners (users who have vehicles assigned)
  const ownersQuery = useQuery({
    queryKey: ['vehicle-owners'],
    queryFn: async (): Promise<EnvioUser[]> => {
      const { data, error } = await supabase
        .from('envio_users')
        .select(`
          id,
          name,
          email,
          phone_number,
          city,
          gp51_username,
          gp51_user_type,
          registration_status,
          created_at,
          updated_at
        `)
        .eq('registration_status', 'approved')
        .order('name');

      if (error) {
        console.error('Failed to fetch owners:', error);
        throw error;
      }

      return (data || []) as EnvioUser[];
    },
    refetchInterval: 30000,
  });

  // Fetch vehicle assignments for a specific owner
  const useOwnerVehicles = (ownerId: string) => {
    return useQuery({
      queryKey: ['owner-vehicles', ownerId],
      queryFn: async (): Promise<VehicleData[]> => {
        const { data, error } = await supabase
          .from('vehicles')
          .select(`
            device_id,
            device_name,
            status,
            created_at
          `)
          .eq('owner_id', ownerId);

        if (error) {
          console.error('Failed to fetch owner vehicles:', error);
          throw error;
        }

        return (data || []) as VehicleData[];
      },
      enabled: !!ownerId,
    });
  };

  // Update owner mutation
  const updateOwnerMutation = useMutation({
    mutationFn: async (updatedOwner: EnvioUser) => {
      const { data, error } = await supabase
        .from('envio_users')
        .update({
          name: updatedOwner.name,
          email: updatedOwner.email,
          phone_number: updatedOwner.phone_number,
          city: updatedOwner.city,
          gp51_username: updatedOwner.gp51_username,
          gp51_user_type: updatedOwner.gp51_user_type,
          registration_status: updatedOwner.registration_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedOwner.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as EnvioUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-owners'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-user-data'] });
      toast({
        title: "Owner Updated",
        description: "Owner profile has been successfully updated",
      });
    },
    onError: (error: Error) => {
      console.error('Failed to update owner:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update owner profile",
        variant: "destructive",
      });
    },
  });

  // Assign vehicle to owner mutation
  const assignVehicleMutation = useMutation({
    mutationFn: async (params: { deviceId: string; ownerId: string }) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          owner_id: params.ownerId,
          updated_at: new Date().toISOString(),
        })
        .eq('device_id', params.deviceId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-owners'] });
      queryClient.invalidateQueries({ queryKey: ['owner-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-vehicle-data'] });
      toast({
        title: "Vehicle Assigned",
        description: "Vehicle has been successfully assigned to owner",
      });
    },
    onError: (error: Error) => {
      console.error('Failed to assign vehicle:', error);
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign vehicle to owner",
        variant: "destructive",
      });
    },
  });

  // Unassign vehicle from owner mutation
  const unassignVehicleMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update({
          owner_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('device_id', deviceId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-owners'] });
      queryClient.invalidateQueries({ queryKey: ['owner-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-vehicle-data'] });
      toast({
        title: "Vehicle Unassigned",
        description: "Vehicle has been successfully unassigned from owner",
      });
    },
    onError: (error: Error) => {
      console.error('Failed to unassign vehicle:', error);
      toast({
        title: "Unassignment Failed",
        description: error.message || "Failed to unassign vehicle from owner",
        variant: "destructive",
      });
    },
  });

  return {
    owners: ownersQuery.data || [],
    isLoadingOwners: ownersQuery.isLoading,
    ownersError: ownersQuery.error,
    useOwnerVehicles,
    updateOwner: updateOwnerMutation.mutate,
    isUpdatingOwner: updateOwnerMutation.isPending,
    assignVehicle: assignVehicleMutation.mutate,
    isAssigningVehicle: assignVehicleMutation.isPending,
    unassignVehicle: unassignVehicleMutation.mutate,
    isUnassigningVehicle: unassignVehicleMutation.isPending,
  };
};
