
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Workshop, CreateWorkshopData } from '@/types/workshop';

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

  // Fetch workshops with proper typing
  const { data: workshops, isLoading: workshopsLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn: async (): Promise<Workshop[]> => {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform and ensure all required properties exist
      return (data || []).map(workshop => ({
        id: workshop.id,
        name: workshop.name,
        representative_name: workshop.representative_name,
        email: workshop.email,
        phone_number: workshop.phone_number,
        address: workshop.address,
        status: workshop.status,
        service_types: workshop.service_types || [],
        created_at: workshop.created_at,
        updated_at: workshop.updated_at,
        phone: workshop.phone || workshop.phone_number,
        city: workshop.city || '',
        country: workshop.country || '',
        operating_hours: workshop.operating_hours || '',
        connection_fee: workshop.connection_fee || 0,
        activation_fee: workshop.activation_fee || 0,
        verified: workshop.verified || false,
        is_active: workshop.is_active !== false,
        rating: workshop.rating || 0,
        review_count: workshop.review_count || 0
      }));
    }
  });

  // Fetch workshop connections
  const { data: connections } = useQuery({
    queryKey: ['workshop-connections'],
    queryFn: async (): Promise<WorkshopConnection[]> => {
      // Mock data since workshop connections table may not exist
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

  // Search workshops function
  const searchWorkshops = async (city: string, country: string) => {
    // Mock implementation - would filter workshops
    console.log('Searching workshops in:', city, country);
  };

  return {
    workshops: workshops || [],
    connections: connections || [],
    isLoading: isLoading || workshopsLoading,
    isConnecting: connectToWorkshopMutation.isPending,
    createWorkshop: createWorkshopMutation.mutate,
    updateWorkshopStatus: updateWorkshopStatusMutation.mutate,
    connectToWorkshop: connectToWorkshopMutation.mutate,
    searchWorkshops,
    isCreating: createWorkshopMutation.isPending,
    isUpdating: updateWorkshopStatusMutation.isPending
  };
};
