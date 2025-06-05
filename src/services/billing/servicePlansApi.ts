
import { supabase } from '@/integrations/supabase/client';
import { ServicePlan } from '@/types/billing';

export const servicePlansApi = {
  async getServicePlans(): Promise<ServicePlan[]> {
    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return (data || []) as ServicePlan[];
  },

  async getServicePlan(id: string): Promise<ServicePlan | null> {
    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ServicePlan | null;
  }
};
