
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BillingSettings {
  id: string;
  user_id: string;
  subscription_plan: string;
  billing_cycle: string;
  auto_renewal: boolean;
  currency: string;
  billing_amount?: number;
  next_billing_date?: string;
  current_usage?: Record<string, any>;
  usage_limits?: Record<string, any>;
  payment_methods?: Array<any>;
  created_at: string;
  updated_at: string;
}

export const useBillingSettings = () => {
  const [settings, setSettings] = useState<BillingSettings | null>(null);
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
        .from('billing_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching billing settings:', error);
      toast({
        title: "Error",
        description: "Failed to load billing settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<BillingSettings>) => {
    setIsUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('billing_settings')
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
        description: "Billing settings have been successfully updated."
      });
    } catch (error) {
      console.error('Error updating billing settings:', error);
      toast({
        title: "Error",
        description: "Failed to update billing settings.",
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
