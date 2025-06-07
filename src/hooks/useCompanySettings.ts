
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  contact_email?: string;
  company_address?: string;
  phone_number?: string;
  fleet_size?: number;
  operational_hours?: string;
  timezone: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export const useCompanySettings = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching company settings:', error);
      toast({
        title: "Error",
        description: "Failed to load company settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<CompanySettings>) => {
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('company_settings')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setSettings(data);
      toast({
        title: "Settings updated",
        description: "Company settings have been successfully updated."
      });
    } catch (error) {
      console.error('Error updating company settings:', error);
      toast({
        title: "Error",
        description: "Failed to update company settings.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    settings,
    isLoading,
    isUpdating,
    updateSettings,
    refetch: fetchSettings
  };
};
