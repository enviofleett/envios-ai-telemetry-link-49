
export interface MaintenanceServicePlan {
  id: string;
  name: string;
  description?: string;
  service_types: string[];
  base_price: number;
  billing_interval: 'monthly' | 'quarterly' | 'annual';
  features?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceAppointment {
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

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  workshop_id?: string;
  appointment_id?: string;
  maintenance_type: string;
  description: string;
  cost?: number;
  mileage?: number;
  performed_by?: string;
  parts_used?: any[];
  next_maintenance_date?: string;
  next_maintenance_mileage?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  performed_at: string;
}

export interface MaintenanceSchedule {
  id: string;
  vehicle_id: string;
  workshop_id?: string;
  schedule_type: 'time_based' | 'mileage_based' | 'condition_based';
  maintenance_type: string;
  interval_months?: number;
  interval_miles?: number;
  last_performed_date?: string;
  last_performed_mileage?: number;
  next_due_date?: string;
  next_due_mileage?: number;
  is_active: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceNotification {
  id: string;
  user_id: string;
  vehicle_id: string;
  notification_type: 'due_reminder' | 'overdue_alert' | 'appointment_reminder' | 'inspection_due';
  title: string;
  message: string;
  scheduled_for: string;
  sent_at?: string;
  status: 'pending' | 'sent' | 'failed';
  metadata?: any;
  created_at: string;
}

export interface CreateAppointmentData {
  workshop_id: string;
  vehicle_id: string;
  appointment_type: MaintenanceAppointment['appointment_type'];
  scheduled_date: string;
  duration_minutes?: number;
  service_description?: string;
  estimated_cost?: number;
  notes?: string;
}
