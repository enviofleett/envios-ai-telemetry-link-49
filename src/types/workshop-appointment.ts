
export interface WorkshopAppointment {
  id: string;
  workshop_id: string;
  vehicle_id: string;
  user_id: string;
  appointment_type: 'maintenance' | 'inspection' | 'repair' | 'diagnostic' | 'consultation';
  appointment_status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduled_date: string;
  duration_minutes: number;
  service_description?: string;
  estimated_cost?: number;
  actual_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export interface WorkshopAvailability {
  id: string;
  workshop_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_concurrent_appointments?: number;
  buffer_minutes?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkshopBlackoutDate {
  id: string;
  workshop_id: string;
  blackout_date: string;
  reason?: string;
  is_recurring: boolean;
  recurring_type?: 'weekly' | 'monthly' | 'yearly';
  created_at: string;
}

export interface AppointmentConflict {
  id: string;
  appointment_id: string;
  conflict_type: 'time_overlap' | 'capacity_exceeded' | 'blackout_date' | 'outside_hours';
  conflict_details?: any;
  resolution_status: 'unresolved' | 'resolved' | 'ignored';
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
}

export interface CreateAppointmentData {
  workshop_id: string;
  vehicle_id: string;
  appointment_type: WorkshopAppointment['appointment_type'];
  scheduled_date: string;
  duration_minutes?: number;
  service_description?: string;
  estimated_cost?: number;
  notes?: string;
}
