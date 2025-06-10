
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { 
  MaintenanceServicePlan, 
  MaintenanceAppointment, 
  MaintenanceRecord,
  MaintenanceSchedule,
  MaintenanceNotification,
  CreateAppointmentData
} from '@/types/maintenance';

export const useMaintenance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Service Plans
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

  // Appointments
  const getUserAppointments = async (): Promise<MaintenanceAppointment[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from('maintenance_appointments' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }
      return (data as unknown as MaintenanceAppointment[]) || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  };

  const createAppointment = async (appointmentData: CreateAppointmentData): Promise<MaintenanceAppointment | null> => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create an appointment",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_appointments' as any)
        .insert({
          ...appointmentData,
          user_id: user.id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        toast({
          title: "Error",
          description: "Failed to create appointment",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Appointment Created",
        description: "Your maintenance appointment has been scheduled"
      });
      return data as unknown as MaintenanceAppointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create appointment",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (
    appointmentId: string, 
    status: MaintenanceAppointment['appointment_status']
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('maintenance_appointments' as any)
        .update({ appointment_status: status })
        .eq('id', appointmentId);

      if (error) {
        console.error('Error updating appointment:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error updating appointment:', error);
      return false;
    }
  };

  // Maintenance Records
  const getMaintenanceHistory = async (vehicleId?: string): Promise<MaintenanceRecord[]> => {
    if (!user?.id) return [];

    try {
      let query = supabase.from('maintenance_records' as any).select('*');

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query.order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching maintenance history:', error);
        return [];
      }
      return (data as unknown as MaintenanceRecord[]) || [];
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
      return [];
    }
  };

  // Maintenance Schedules
  const getMaintenanceSchedules = async (vehicleId?: string): Promise<MaintenanceSchedule[]> => {
    if (!user?.id) return [];

    try {
      let query = supabase
        .from('maintenance_schedules' as any)
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
      return (data as unknown as MaintenanceSchedule[]) || [];
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      return [];
    }
  };

  // Notifications
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

  // Statistics
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
        .from('maintenance_appointments' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('appointment_status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString());

      // Get pending maintenance schedules
      const { data: schedules } = await supabase
        .from('maintenance_schedules' as any)
        .select('id')
        .eq('is_active', true)
        .lte('next_due_date', new Date().toISOString());

      // Get completed maintenance this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: completed } = await supabase
        .from('maintenance_records' as any)
        .select('id, cost')
        .eq('status', 'completed')
        .gte('performed_at', startOfMonth.toISOString());

      const totalSpent = completed?.reduce((sum: number, record: any) => sum + (record.cost || 0), 0) || 0;

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
    loading,
    getServicePlans,
    getUserAppointments,
    createAppointment,
    updateAppointmentStatus,
    getMaintenanceHistory,
    getMaintenanceSchedules,
    getMaintenanceNotifications,
    getMaintenanceStats
  };
};

export default useMaintenance;
