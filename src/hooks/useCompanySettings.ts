
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanySettings {
  id?: string;
  user_id?: string;
  company_name: string;
  contact_email: string;
  company_address: string;
  phone_number: string;
  fleet_size: number;
  operational_hours: string;
  timezone: string;
  logo_url: string;
  created_at?: string;
  updated_at?: string;
}

export const useCompanySettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data || {
        company_name: '',
        contact_email: '',
        company_address: '',
        phone_number: '',
        fleet_size: 0,
        operational_hours: '',
        timezone: 'UTC',
        logo_url: ''
      };
    }
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<CompanySettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('company_settings')
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
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({
        title: "Success",
        description: "Company settings saved successfully"
      });
    },
    onError: (error) => {
      console.error('Failed to save company settings:', error);
      toast({
        title: "Error",
        description: "Failed to save company settings",
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
