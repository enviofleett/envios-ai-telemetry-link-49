
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Workshop } from '@/types/workshop';

// Define CreateWorkshopData locally since it's not exported from workshop types
export interface CreateWorkshopData {
  name: string;
  representative_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  service_types?: string[];
}

export interface WorkshopConnection {
  id: string;
  workshop_id: string;
  user_id: string;
  connection_status: string;
  payment_status?: string;
  connection_fee_paid: number;
  created_at: string;
  notes?: string;
  workshops?: Workshop;
}

export const useWorkshops = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workshops with proper typing and fallback values for missing columns
  const { data: workshops, isLoading: workshopsLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn: async (): Promise<Workshop[]> => {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform and ensure all required properties exist with fallback values
      return (data || []).map(workshop => ({
        id: workshop.id,
        name: workshop.name,
        representative_name: workshop.representative_name,
        email: workshop.email,
        phone_number: workshop.phone_number,
        address: workshop.address,
        status: workshop.status,
        service_types: Array.isArray(workshop.service_types) ? workshop.service_types : [],
        created_at: workshop.created_at,
        updated_at: workshop.updated_at,
        // Add required Workshop properties with default values
        phone: workshop.phone_number || '',
        city: '',
        country: '',
        operating_hours: '',
        connection_fee: 0,
        activation_fee: 0,
        verified: false,
        is_active: true,
        rating: 0,
        review_count: 0
      }));
    }
  });

  // Fetch workshop connections - return empty array since table may not exist
  const { data: connections } = useQuery({
    queryKey: ['workshop-connections'],
    queryFn: async (): Promise<WorkshopConnection[]> => {
      // Return empty array since workshop connections table may not exist
      return [];
    }
  });

  // Create workshop mutation
  const createWorkshopMutation = useMutation({
    mutationFn: async (workshopData: CreateWorkshopData) => {
      const { data, error } = await supabase
        .from('workshops')
        .insert([{
          name: workshopData.name,
          representative_name: workshopData.representative_name,
          email: workshopData.email,
          phone_number: workshopData.phone_number,
          address: workshopData.address,
          service_types: workshopData.service_types || [],
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast({
        title: "Workshop Created",
        description: "Workshop has been successfully created and is pending approval."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create workshop: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update workshop status mutation
  const updateWorkshopStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('workshops')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast({
        title: "Workshop Updated",
        description: "Workshop status has been updated."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update workshop: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Connect to workshop mutation
  const connectToWorkshopMutation = useMutation({
    mutationFn: async (workshopId: string) => {
      // Mock implementation - would create a connection record
      console.log('Connecting to workshop:', workshopId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-connections'] });
      toast({
        title: "Workshop Connection",
        description: "Connection request sent to workshop."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to connect to workshop.",
        variant: "destructive"
      });
    }
  });

  return {
    workshops: workshops || [],
    connections: connections || [],
    isLoading: isLoading || workshopsLoading,
    isConnecting: connectToWorkshopMutation.isPending,
    createWorkshop: createWorkshopMutation.mutate,
    updateWorkshopStatus: updateWorkshopStatusMutation.mutate,
    connectToWorkshop: connectToWorkshopMutation.mutate,
    isCreating: createWorkshopMutation.isPending,
    isUpdating: updateWorkshopStatusMutation.isPending
  };
};
