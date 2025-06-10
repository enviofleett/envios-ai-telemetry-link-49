
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Workshop } from '@/types/workshop';

export const useWorkshopManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all workshops for admin
  const { data: allWorkshops, isLoading: workshopsLoading } = useQuery({
    queryKey: ['admin-workshops'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshops')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Workshop[];
    }
  });

  // Approve workshop mutation
  const approveWorkshopMutation = useMutation({
    mutationFn: async ({ workshopId, notes }: { workshopId: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('workshops')
        .update({
          verified: true,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', workshopId)
        .select()
        .single();

      if (error) throw error;

      // Note: Approval logging would be implemented when workshop_approval_logs table is created
      console.log('Workshop approved:', workshopId, notes ? `with notes: ${notes}` : '');

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workshops'] });
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast({
        title: "Workshop Approved",
        description: "The workshop has been successfully approved and activated."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to approve workshop: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Reject workshop mutation
  const rejectWorkshopMutation = useMutation({
    mutationFn: async ({ workshopId, reason }: { workshopId: string; reason: string }) => {
      const { data, error } = await supabase
        .from('workshops')
        .update({
          verified: false,
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', workshopId)
        .select()
        .single();

      if (error) throw error;

      // Note: Rejection logging would be implemented when workshop_approval_logs table is created
      console.log('Workshop rejected:', workshopId, `reason: ${reason}`);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-workshops'] });
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast({
        title: "Workshop Rejected",
        description: "The workshop has been rejected and deactivated."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to reject workshop: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Get workshop statistics
  const getWorkshopStats = () => {
    if (!allWorkshops) return null;

    return {
      total: allWorkshops.length,
      pending: allWorkshops.filter(w => !w.verified && w.is_active).length,
      approved: allWorkshops.filter(w => w.verified && w.is_active).length,
      rejected: allWorkshops.filter(w => !w.is_active).length
    };
  };

  return {
    allWorkshops,
    isLoading: isLoading || workshopsLoading,
    approveWorkshop: approveWorkshopMutation.mutate,
    rejectWorkshop: rejectWorkshopMutation.mutate,
    isApproving: approveWorkshopMutation.isPending,
    isRejecting: rejectWorkshopMutation.isPending,
    workshopStats: getWorkshopStats()
  };
};
