
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Workshop, WorkshopConnection, CreateWorkshopData } from '@/types/workshop';

export const useWorkshops = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all active workshops
  const { data: workshops, isLoading: workshopsLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Workshop[];
    }
  });

  // Fetch user's workshop connections
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['workshop-connections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_connections')
        .select(`
          *,
          workshops(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Create workshop mutation
  const createWorkshopMutation = useMutation({
    mutationFn: async (workshopData: CreateWorkshopData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workshops')
        .insert([{
          ...workshopData,
          created_by: user.id
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
        description: "Your workshop has been successfully registered."
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

  // Connect to workshop mutation
  const connectToWorkshopMutation = useMutation({
    mutationFn: async (workshopId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workshop_connections')
        .insert([{
          workshop_id: workshopId,
          user_id: user.id,
          connection_status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-connections'] });
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent to the workshop."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to connect to workshop: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Search workshops by location
  const searchWorkshops = useCallback(async (city?: string, country?: string) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('workshops')
        .select('*')
        .eq('is_active', true);

      if (city) {
        query = query.ilike('city', `%${city}%`);
      }
      if (country) {
        query = query.ilike('country', `%${country}%`);
      }

      const { data, error } = await query.order('rating', { ascending: false });
      
      if (error) throw error;
      return data as Workshop[];
    } catch (error) {
      toast({
        title: "Search Error",
        description: "Failed to search workshops",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    workshops,
    connections,
    isLoading: isLoading || workshopsLoading || connectionsLoading,
    createWorkshop: createWorkshopMutation.mutate,
    connectToWorkshop: connectToWorkshopMutation.mutate,
    searchWorkshops,
    isCreatingWorkshop: createWorkshopMutation.isPending,
    isConnecting: connectToWorkshopMutation.isPending
  };
};
