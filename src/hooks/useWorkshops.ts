
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Workshop, CreateWorkshopData } from '@/types/workshop';

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
        is_active: workshop.is_active !== false, // Default to true if undefined
        rating: workshop.rating || 0,
        review_count: workshop.review_count || 0
      }));
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

  return {
    workshops: workshops || [],
    isLoading: isLoading || workshopsLoading,
    createWorkshop: createWorkshopMutation.mutate,
    updateWorkshopStatus: updateWorkshopStatusMutation.mutate,
    isCreating: createWorkshopMutation.isPending,
    isUpdating: updateWorkshopStatusMutation.isPending
  };
};
