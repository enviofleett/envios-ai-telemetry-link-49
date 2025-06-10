
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceServicePlan } from '@/types/maintenance';

export const useMaintenanceServicePlans = () => {
  const [loading, setLoading] = useState(false);

  const getServicePlans = async (): Promise<MaintenanceServicePlan[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_service_plans')
        .select('*')
        .eq('is_active', true)
        .order('base_price', { ascending: true });

      if (error) {
        console.error('Error fetching service plans:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching service plans:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createServicePlan = async (planData: Omit<MaintenanceServicePlan, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceServicePlan | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_service_plans')
        .insert(planData)
        .select()
        .single();

      if (error) {
        console.error('Error creating service plan:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating service plan:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getServicePlans,
    createServicePlan
  };
};
