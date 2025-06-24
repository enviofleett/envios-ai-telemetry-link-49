
export interface Workshop {
  id: string;
  name: string;
  representative_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  status: string;
  service_types?: string[] | any;
  created_at: string;
  updated_at: string;
  // Optional properties that some components might expect
  phone?: string;
  city?: string;
  country?: string;
  operating_hours?: string;
  connection_fee?: number;
  activation_fee?: number;
  verified?: boolean;
  is_active?: boolean;
  rating?: number;
  review_count?: number;
}

export interface WorkshopConnection {
  id: string;
  workshop_id: string;
  vehicle_id: string;
  connection_type: string;
  status: string;
  established_at: string;
  workshop?: Workshop;
}

// Simplified appointment types that don't rely on database tables
export interface WorkshopAppointment {
  id: string;
  workshop_id: string;
  user_id: string;
  vehicle_id?: string;
  appointment_type: string;
  appointment_status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_date: string;
  duration_minutes: number;
  service_description?: string;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  workshops?: {
    name: string;
    phone: string;
    email: string;
  };
}

export interface WorkshopAvailability {
  id: string;
  workshop_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  max_appointments?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentData {
  workshop_id: string;
  vehicle_id?: string;
  appointment_type: string;
  scheduled_date: string;
  duration_minutes: number;
  service_description?: string;
  notes?: string;
}
