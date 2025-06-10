
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MaintenanceNotification } from '@/types/maintenance';

export const useMaintenanceNotifications = () => {
  const { user } = useAuth();

  const getMaintenanceNotifications = async (): Promise<MaintenanceNotification[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('maintenance_notifications' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      return (data as unknown as MaintenanceNotification[]) || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  };

  return {
    getMaintenanceNotifications
  };
};
