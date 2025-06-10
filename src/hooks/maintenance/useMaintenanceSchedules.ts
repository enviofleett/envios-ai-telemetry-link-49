
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MaintenanceSchedule } from '@/types/maintenance';

export const useMaintenanceSchedules = () => {
  const { user } = useAuth();

  const getMaintenanceSchedules = async (vehicleId?: string): Promise<MaintenanceSchedule[]> => {
    if (!user?.id) return [];

    try {
      let query = supabase
        .from('maintenance_schedules')
        .select('*')
        .eq('is_active', true);

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query.order('next_due_date', { ascending: true });

      if (error) {
        console.error('Error fetching maintenance schedules:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      return [];
    }
  };

  const createMaintenanceSchedule = async (scheduleData: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceSchedule | null> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .insert(scheduleData)
        .select()
        .single();

      if (error) {
        console.error('Error creating maintenance schedule:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating maintenance schedule:', error);
      return null;
    }
  };

  return {
    getMaintenanceSchedules,
    createMaintenanceSchedule
  };
};
