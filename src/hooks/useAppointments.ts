
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkshopAppointment, WorkshopAvailability, CreateAppointmentData } from '@/types/workshop-appointment';

export const useAppointments = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['workshop-appointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_appointments')
        .select(`
          *,
          workshops(name, phone, email)
        `)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as WorkshopAppointment[];
    }
  });

  // Fetch workshop availability
  const { data: availability } = useQuery({
    queryKey: ['workshop-availability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workshop_availability')
        .select('*')
        .eq('is_available', true)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data as WorkshopAvailability[];
    }
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: CreateAppointmentData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('workshop_appointments')
        .insert([{
          ...appointmentData,
          user_id: user.id,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-appointments'] });
      toast({
        title: "Appointment Scheduled",
        description: "Your appointment has been successfully scheduled."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to schedule appointment: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Update appointment status mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: WorkshopAppointment['appointment_status']; notes?: string }) => {
      const updateData: any = { appointment_status: status };
      if (notes) updateData.notes = notes;

      const { data, error } = await supabase
        .from('workshop_appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-appointments'] });
      toast({
        title: "Appointment Updated",
        description: "Appointment status has been updated."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update appointment: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Cancel appointment mutation
  const cancelAppointmentMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('workshop_appointments')
        .update({
          appointment_status: 'cancelled',
          cancellation_reason: reason
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workshop-appointments'] });
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to cancel appointment: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  // Get available time slots for a workshop on a specific date
  const getAvailableTimeSlots = async (workshopId: string, date: string) => {
    setIsLoading(true);
    try {
      const dayOfWeek = new Date(date).getDay();
      
      // Get workshop availability for the day
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('workshop_availability')
        .select('*')
        .eq('workshop_id', workshopId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_available', true);

      if (availabilityError) throw availabilityError;

      // Get existing appointments for the date
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('workshop_appointments')
        .select('scheduled_date, duration_minutes')
        .eq('workshop_id', workshopId)
        .gte('scheduled_date', `${date}T00:00:00`)
        .lt('scheduled_date', `${date}T23:59:59`)
        .in('appointment_status', ['scheduled', 'confirmed', 'in_progress']);

      if (appointmentsError) throw appointmentsError;

      // Check for blackout dates
      const { data: blackoutData, error: blackoutError } = await supabase
        .from('workshop_blackout_dates')
        .select('*')
        .eq('workshop_id', workshopId)
        .eq('blackout_date', date);

      if (blackoutError) throw blackoutError;

      if (blackoutData && blackoutData.length > 0) {
        return []; // No slots available on blackout dates
      }

      // Generate available time slots based on availability and existing appointments
      const timeSlots: string[] = [];
      
      availabilityData.forEach(availability => {
        const startTime = new Date(`${date}T${availability.start_time}`);
        const endTime = new Date(`${date}T${availability.end_time}`);
        const slotDuration = 60; // 1 hour slots
        
        for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + slotDuration)) {
          const slotTime = time.toTimeString().slice(0, 5);
          const slotDateTime = `${date}T${slotTime}:00`;
          
          // Check if slot conflicts with existing appointments
          const hasConflict = appointmentsData?.some(appointment => {
            const appointmentStart = new Date(appointment.scheduled_date);
            const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000);
            const slotStart = new Date(slotDateTime);
            const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
            
            return (slotStart < appointmentEnd && slotEnd > appointmentStart);
          });
          
          if (!hasConflict) {
            timeSlots.push(slotTime);
          }
        }
      });

      return timeSlots;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch available time slots",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    appointments,
    availability,
    isLoading: isLoading || appointmentsLoading,
    createAppointment: createAppointmentMutation.mutate,
    updateAppointment: updateAppointmentMutation.mutate,
    cancelAppointment: cancelAppointmentMutation.mutate,
    getAvailableTimeSlots,
    isCreating: createAppointmentMutation.isPending,
    isUpdating: updateAppointmentMutation.isPending,
    isCancelling: cancelAppointmentMutation.isPending
  };
};
