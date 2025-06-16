
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { EnvioUser } from '@/types/owner';

export const useOwnerMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateOwnerMutation = useMutation({
    mutationFn: async (updatedOwner: EnvioUser): Promise<EnvioUser | null> => {
      const { data, error } = (await supabase
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
        .eq('id', updatedOwner.id as any)
        .select()
        .single()) as any; // Aggressive fix to bypass TS2589

      if (error) {
        throw error;
      }

      return data as any; // Targeted fix to bypass TS2589
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

  const assignVehicleMutation = useMutation({
    mutationFn: async (params: { deviceId: string; ownerId: string }): Promise<any> => {
      const { data, error } = (await supabase
        .from('vehicles')
        .update({
          owner_id: params.ownerId as any,
          updated_at: new Date().toISOString(),
        })
        .eq('device_id', params.deviceId as any) // Ultimate fix: cast the problematic parameter
        .select()
        .single()) as any; // Aggressive fix to bypass TS2589

      if (error) {
        throw error;
      }

      return data as any; // Targeted fix to bypass TS2589
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

  const unassignVehicleMutation = useMutation({
    mutationFn: async (deviceId: string): Promise<any> => {
      const { data, error } = (await supabase
        .from('vehicles')
        .update({
          owner_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('device_id', deviceId as any) // Ultimate fix: cast the parameter
        .select()
        .single()) as any; // Aggressive fix to bypass TS2589

      if (error) {
        throw error;
      }

      return data as any; // Targeted fix to bypass TS2589
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
    updateOwner: updateOwnerMutation.mutate,
    isUpdatingOwner: updateOwnerMutation.isPending,
    assignVehicle: assignVehicleMutation.mutate,
    isAssigningVehicle: assignVehicleMutation.isPending,
    unassignVehicle: unassignVehicleMutation.mutate,
    isUnassigningVehicle: unassignVehicleMutation.isPending,
  };
};
