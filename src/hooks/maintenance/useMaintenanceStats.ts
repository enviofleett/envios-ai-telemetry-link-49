
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMaintenanceStats = () => {
  const { user } = useAuth();

  const getMaintenanceStats = async () => {
    if (!user?.id) return {
      upcomingAppointments: 0,
      pendingMaintenance: 0,
      completedThisMonth: 0,
      totalSpent: 0
    };

    try {
      // Get upcoming appointments
      const { data: appointments } = await supabase
        .from('maintenance_appointments')
        .select('id, actual_cost')
        .eq('user_id', user.id)
        .eq('appointment_status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString());

      // Get pending maintenance schedules (overdue)
      const { data: schedules } = await supabase
        .from('maintenance_schedules')
        .select('id')
        .eq('is_active', true)
        .lte('next_due_date', new Date().toISOString().split('T')[0]);

      // Get completed appointments this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: completed } = await supabase
        .from('maintenance_appointments')
        .select('id, actual_cost')
        .eq('user_id', user.id)
        .eq('appointment_status', 'completed')
        .gte('completed_at', startOfMonth.toISOString());

      const totalSpent = completed?.reduce((sum: number, record: any) => sum + (record.actual_cost || 0), 0) || 0;

      return {
        upcomingAppointments: appointments?.length || 0,
        pendingMaintenance: schedules?.length || 0,
        completedThisMonth: completed?.length || 0,
        totalSpent
      };
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      return {
        upcomingAppointments: 0,
        pendingMaintenance: 0,
        completedThisMonth: 0,
        totalSpent: 0
      };
    }
  };

  return {
    getMaintenanceStats
  };
};
