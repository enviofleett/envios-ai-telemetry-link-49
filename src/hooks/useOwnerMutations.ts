
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { EnvioUser } from '@/types/owner';

export const useOwnerMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
      queryClient.invalidateQueries({ queryKey: ['vehicle-owners'] } as any);
      queryClient.invalidateQueries({ queryKey: ['enhanced-user-data'] } as any);
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
      queryClient.invalidateQueries({ queryKey: ['vehicle-owners'] } as any);
      queryClient.invalidateQueries({ queryKey: ['owner-vehicles'] } as any);
      queryClient.invalidateQueries({ queryKey: ['enhanced-vehicle-data'] } as any);
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
      queryClient.invalidateQueries({ queryKey: ['vehicle-owners'] } as any);
      queryClient.invalidateQueries({ queryKey: ['owner-vehicles'] } as any);
      queryClient.invalidateQueries({ queryKey: ['enhanced-vehicle-data'] } as any);
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
    updateOwner: updateOwnerMutation.mutate,
    isUpdatingOwner: updateOwnerMutation.isPending,
    assignVehicle: assignVehicleMutation.mutate,
    isAssigningVehicle: assignVehicleMutation.isPending,
    unassignVehicle: unassignVehicleMutation.mutate,
    isUnassigningVehicle: unassignVehicleMutation.isPending,
  };
};
