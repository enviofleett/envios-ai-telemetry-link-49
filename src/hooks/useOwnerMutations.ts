
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Simple interface to avoid circular type dependencies
interface SimpleUser {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  city: string | null;
  gp51_username: string | null;
  gp51_user_type: number;
  registration_status: string;
  updated_at?: string;
}

// Explicitly typed mutation functions separated from useMutation calls
const updateOwnerFunction = async (updatedOwner: any): Promise<any> => {
  const supabaseClient = (await import('@/integrations/supabase/client')).supabase as any;
  
  const { data, error } = await supabaseClient
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

  return data;
};

const assignVehicleFunction = async (params: any): Promise<any> => {
  const supabaseClient = (await import('@/integrations/supabase/client')).supabase as any;
  
  const { data, error } = await supabaseClient
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
};

const unassignVehicleFunction = async (deviceId: any): Promise<any> => {
  const supabaseClient = (await import('@/integrations/supabase/client')).supabase as any;
  
  const { data, error } = await supabaseClient
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
};

export const useOwnerMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Explicitly typed useMutation with complete generic specification
  const updateOwnerMutation = useMutation<any, Error, any>({
    mutationFn: updateOwnerFunction,
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

  const assignVehicleMutation = useMutation<any, Error, any>({
    mutationFn: assignVehicleFunction,
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

  const unassignVehicleMutation = useMutation<any, Error, any>({
    mutationFn: unassignVehicleFunction,
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
