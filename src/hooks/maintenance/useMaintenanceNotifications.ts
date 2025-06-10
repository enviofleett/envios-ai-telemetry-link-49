
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { MaintenanceNotification } from '@/types/maintenance';

export const useMaintenanceNotifications = () => {
  const { user } = useAuth();

  const getMaintenanceNotifications = async (): Promise<MaintenanceNotification[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('maintenance_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  };

  const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('maintenance_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  return {
    getMaintenanceNotifications,
    markNotificationAsRead
  };
};
