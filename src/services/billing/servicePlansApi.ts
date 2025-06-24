
import { supabase } from '@/integrations/supabase/client';
import { ServicePlan } from '@/types/billing';

// Transform database service plan to application service plan
const transformServicePlan = (dbPlan: any): ServicePlan => ({
  id: dbPlan.id,
  plan_name: dbPlan.plan_name,
  description: dbPlan.description,
  plan_code: dbPlan.plan_code,
  price_1_year: dbPlan.price_1_year,
  price_3_year: dbPlan.price_3_year,
  price_5_year: dbPlan.price_5_year,
  price_10_year: dbPlan.price_10_year,
  features: dbPlan.features,
  is_active: dbPlan.is_active,
  sort_order: dbPlan.sort_order,
  created_at: dbPlan.created_at,
  updated_at: dbPlan.updated_at
});

export const servicePlansApi = {
  async getServicePlans(): Promise<ServicePlan[]> {
    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    return (data || []).map(transformServicePlan);
  },

  async getServicePlan(id: string): Promise<ServicePlan | null> {
    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformServicePlan(data) : null;
  }
};
