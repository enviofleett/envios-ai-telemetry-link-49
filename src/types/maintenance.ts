
export interface MaintenanceServicePlan {
  id: string;
  name: string;
  description?: string;
  service_types: string[];
  base_price: number;
  duration_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceAppointment {
  id: string;
  workshop_id: string;
  vehicle_id: string;
  user_id: string;
  service_plan_id?: string;
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

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  appointment_id?: string;
  maintenance_type: string;
  description: string;
  performed_by?: string;
  performed_at: string;
  cost?: number;
  status: 'completed' | 'pending' | 'failed';
  parts_used?: any[];
  next_maintenance_due?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceSchedule {
  id: string;
  vehicle_id: string;
  schedule_type: 'time_based' | 'mileage_based' | 'condition_based';
  maintenance_type: string;
  interval_value: number;
  interval_unit: 'days' | 'weeks' | 'months' | 'years' | 'kilometers' | 'miles';
  last_performed_at?: string;
  next_due_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceNotification {
  id: string;
  user_id: string;
  vehicle_id?: string;
  appointment_id?: string;
  notification_type: 'reminder' | 'overdue' | 'scheduled' | 'completed' | 'cancelled';
  title: string;
  message: string;
  scheduled_for: string;
  sent_at?: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateAppointmentData {
  workshop_id: string;
  vehicle_id: string;
  service_plan_id?: string;
  appointment_type: MaintenanceAppointment['appointment_type'];
  scheduled_date: string;
  duration_minutes?: number;
  service_description?: string;
  estimated_cost?: number;
  notes?: string;
}
