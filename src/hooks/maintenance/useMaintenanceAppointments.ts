
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { MaintenanceAppointment, CreateAppointmentData } from '@/types/maintenance';

export const useMaintenanceAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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

  return {
    loading,
    getUserAppointments,
    createAppointment,
    updateAppointmentStatus
  };
};
