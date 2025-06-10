
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceServicePlan } from '@/types/maintenance';

export const useMaintenanceServicePlans = () => {
  const [loading, setLoading] = useState(false);

  const getServicePlans = async (): Promise<MaintenanceServicePlan[]> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_service_plans' as any)
        .select('*')
        .eq('is_active', true)
        .order('base_price', { ascending: true });

      if (error) {
        console.error('Error fetching service plans:', error);
        return [];
      }
      return (data as unknown as MaintenanceServicePlan[]) || [];
    } catch (error) {
      console.error('Error fetching service plans:', error);
      return [];
    }
  };

  return {
    loading,
    getServicePlans
  };
};
