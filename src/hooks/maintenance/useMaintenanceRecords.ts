
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MaintenanceRecord } from '@/types/maintenance';

export const useMaintenanceRecords = () => {
  const { user } = useAuth();

  const getMaintenanceHistory = async (vehicleId?: string): Promise<MaintenanceRecord[]> => {
    if (!user?.id) return [];

    try {
      let query = supabase.from('maintenance_records').select('*');

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query.order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance history:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
      return [];
    }
  };

  const createMaintenanceRecord = async (recordData: Omit<MaintenanceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<MaintenanceRecord | null> => {
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .insert(recordData)
        .select()
        .single();

      if (error) {
        console.error('Error creating maintenance record:', error);
        return null;
      }
      return data;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      return null;
    }
  };

  return {
    getMaintenanceHistory,
    createMaintenanceRecord
  };
};
