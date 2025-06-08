
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BillingSettings {
  id?: string;
  user_id?: string;
  subscription_plan: string;
  billing_cycle: string;
  next_billing_date?: string;
  billing_amount: number;
  currency: string;
  payment_methods: any[];
  usage_limits: Record<string, any>;
  current_usage: Record<string, any>;
  auto_renewal: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useBillingSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['billing-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || {
        subscription_plan: 'free',
        billing_cycle: 'monthly',
        billing_amount: 0,
        currency: 'USD',
        payment_methods: [],
        usage_limits: {},
        current_usage: {},
        auto_renewal: true
      };
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<BillingSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('billing_settings')
        .upsert({
          user_id: user.id,
          ...newSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-settings'] });
      toast({
        title: "Success",
        description: "Billing settings saved successfully"
      });
    },
    onError: (error) => {
      console.error('Failed to save billing settings:', error);
      toast({
        title: "Error",
        description: "Failed to save billing settings",
        variant: "destructive"
      });
    }
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending
  };
};
