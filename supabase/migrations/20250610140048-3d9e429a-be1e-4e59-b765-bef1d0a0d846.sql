
-- Create maintenance service plans table
CREATE TABLE public.maintenance_service_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  service_types TEXT[] NOT NULL DEFAULT '{}',
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_hours INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance appointments table
CREATE TABLE public.maintenance_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID NOT NULL,
  user_id UUID NOT NULL,
  service_plan_id UUID REFERENCES public.maintenance_service_plans(id),
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('maintenance', 'inspection', 'repair', 'diagnostic', 'consultation')),
  appointment_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (appointment_status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  service_description TEXT,
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Create maintenance records table
CREATE TABLE public.maintenance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.maintenance_appointments(id),
  maintenance_type TEXT NOT NULL,
  description TEXT NOT NULL,
  performed_by TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cost NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed')),
  parts_used JSONB DEFAULT '[]',
  next_maintenance_due DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance schedules table
CREATE TABLE public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('time_based', 'mileage_based', 'condition_based')),
  maintenance_type TEXT NOT NULL,
  interval_value INTEGER NOT NULL,
  interval_unit TEXT NOT NULL CHECK (interval_unit IN ('days', 'weeks', 'months', 'years', 'kilometers', 'miles')),
  last_performed_at TIMESTAMP WITH TIME ZONE,
  next_due_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance notifications table
CREATE TABLE public.maintenance_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vehicle_id UUID,
  appointment_id UUID REFERENCES public.maintenance_appointments(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'overdue', 'scheduled', 'completed', 'cancelled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for maintenance_service_plans
ALTER TABLE public.maintenance_service_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service plans are viewable by everyone"
  ON public.maintenance_service_plans
  FOR SELECT
  USING (true);

-- Add RLS policies for maintenance_appointments
ALTER TABLE public.maintenance_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments"
  ON public.maintenance_appointments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments"
  ON public.maintenance_appointments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON public.maintenance_appointments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add RLS policies for maintenance_records
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maintenance records are viewable by authenticated users"
  ON public.maintenance_records
  FOR SELECT
  TO authenticated
  USING (true);

-- Add RLS policies for maintenance_schedules
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Maintenance schedules are viewable by authenticated users"
  ON public.maintenance_schedules
  FOR SELECT
  TO authenticated
  USING (true);

-- Add RLS policies for maintenance_notifications
ALTER TABLE public.maintenance_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.maintenance_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.maintenance_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_maintenance_appointments_user_id ON public.maintenance_appointments(user_id);
CREATE INDEX idx_maintenance_appointments_workshop_id ON public.maintenance_appointments(workshop_id);
CREATE INDEX idx_maintenance_appointments_scheduled_date ON public.maintenance_appointments(scheduled_date);
CREATE INDEX idx_maintenance_records_vehicle_id ON public.maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_schedules_vehicle_id ON public.maintenance_schedules(vehicle_id);
CREATE INDEX idx_maintenance_schedules_next_due_date ON public.maintenance_schedules(next_due_date);
CREATE INDEX idx_maintenance_notifications_user_id ON public.maintenance_notifications(user_id);

-- Insert some default service plans
INSERT INTO public.maintenance_service_plans (name, description, service_types, base_price, duration_hours) VALUES
('Basic Oil Change', 'Standard oil and filter change service', ARRAY['Oil Change', 'Filter Replacement'], 50.00, 1),
('Comprehensive Inspection', 'Full vehicle safety and performance inspection', ARRAY['Safety Inspection', 'Engine Diagnostics', 'Brake Check'], 120.00, 2),
('Brake Service', 'Complete brake system service and repair', ARRAY['Brake Inspection', 'Brake Pad Replacement', 'Brake Fluid Change'], 200.00, 3),
('Tire Service', 'Tire rotation, balancing, and replacement', ARRAY['Tire Rotation', 'Wheel Balancing', 'Tire Replacement'], 80.00, 1),
('Engine Diagnostics', 'Advanced engine performance diagnostics', ARRAY['Engine Diagnostics', 'Computer Scan', 'Performance Analysis'], 150.00, 2);
