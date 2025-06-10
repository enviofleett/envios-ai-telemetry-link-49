
-- Create workshop appointments table
CREATE TABLE public.workshop_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  vehicle_id TEXT NOT NULL,
  user_id UUID REFERENCES public.envio_users(id) ON DELETE CASCADE NOT NULL,
  appointment_type TEXT NOT NULL DEFAULT 'maintenance' CHECK (appointment_type IN ('maintenance', 'inspection', 'repair', 'diagnostic', 'consultation')),
  appointment_status TEXT NOT NULL DEFAULT 'scheduled' CHECK (appointment_status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  service_description TEXT,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.envio_users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT
);

-- Create workshop availability table
CREATE TABLE public.workshop_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  max_concurrent_appointments INTEGER DEFAULT 3,
  buffer_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, day_of_week, start_time)
);

-- Create workshop holidays/blackout dates table
CREATE TABLE public.workshop_blackout_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  blackout_date DATE NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_type TEXT CHECK (recurring_type IN ('weekly', 'monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, blackout_date)
);

-- Create appointment conflicts table
CREATE TABLE public.appointment_conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.workshop_appointments(id) ON DELETE CASCADE NOT NULL,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('time_overlap', 'capacity_exceeded', 'blackout_date', 'outside_hours')),
  conflict_details JSONB,
  resolution_status TEXT NOT NULL DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'resolved', 'ignored')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.envio_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointment notifications table
CREATE TABLE public.appointment_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.workshop_appointments(id) ON DELETE CASCADE NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('confirmation', 'reminder_24h', 'reminder_2h', 'rescheduled', 'cancelled')),
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.workshop_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for workshop_appointments
CREATE POLICY "Users can view their own appointments"
  ON public.workshop_appointments
  FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.workshop_users wu 
    WHERE wu.workshop_id = workshop_appointments.workshop_id 
    AND wu.id = auth.uid()
  ));

CREATE POLICY "Users can create appointments"
  ON public.workshop_appointments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and workshop staff can update appointments"
  ON public.workshop_appointments
  FOR UPDATE
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.workshop_users wu 
    WHERE wu.workshop_id = workshop_appointments.workshop_id 
    AND wu.id = auth.uid()
  ));

-- RLS policies for workshop_availability
CREATE POLICY "Workshop staff can manage availability"
  ON public.workshop_availability
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workshop_users wu 
    WHERE wu.workshop_id = workshop_availability.workshop_id 
    AND wu.id = auth.uid()
  ));

CREATE POLICY "Anyone can view workshop availability"
  ON public.workshop_availability
  FOR SELECT
  USING (true);

-- RLS policies for workshop_blackout_dates
CREATE POLICY "Workshop staff can manage blackout dates"
  ON public.workshop_blackout_dates
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.workshop_users wu 
    WHERE wu.workshop_id = workshop_blackout_dates.workshop_id 
    AND wu.id = auth.uid()
  ));

CREATE POLICY "Anyone can view blackout dates"
  ON public.workshop_blackout_dates
  FOR SELECT
  USING (true);

-- RLS policies for appointment_conflicts
CREATE POLICY "Workshop staff and appointment owners can view conflicts"
  ON public.appointment_conflicts
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workshop_appointments wa
    JOIN public.workshop_users wu ON wu.workshop_id = wa.workshop_id
    WHERE wa.id = appointment_conflicts.appointment_id
    AND (wu.id = auth.uid() OR wa.user_id = auth.uid())
  ));

-- RLS policies for appointment_notifications
CREATE POLICY "Workshop staff and appointment owners can view notifications"
  ON public.appointment_notifications
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workshop_appointments wa
    JOIN public.workshop_users wu ON wu.workshop_id = wa.workshop_id
    WHERE wa.id = appointment_notifications.appointment_id
    AND (wu.id = auth.uid() OR wa.user_id = auth.uid())
  ));

-- Create indexes for better performance
CREATE INDEX idx_workshop_appointments_workshop_id ON public.workshop_appointments(workshop_id);
CREATE INDEX idx_workshop_appointments_user_id ON public.workshop_appointments(user_id);
CREATE INDEX idx_workshop_appointments_scheduled_date ON public.workshop_appointments(scheduled_date);
CREATE INDEX idx_workshop_appointments_status ON public.workshop_appointments(appointment_status);
CREATE INDEX idx_workshop_availability_workshop_id ON public.workshop_availability(workshop_id);
CREATE INDEX idx_workshop_blackout_dates_workshop_id ON public.workshop_blackout_dates(workshop_id);
CREATE INDEX idx_workshop_blackout_dates_date ON public.workshop_blackout_dates(blackout_date);

-- Create function to check appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
  availability_record RECORD;
  is_blackout BOOLEAN;
BEGIN
  -- Check for blackout dates
  SELECT EXISTS(
    SELECT 1 FROM workshop_blackout_dates 
    WHERE workshop_id = NEW.workshop_id 
    AND blackout_date = NEW.scheduled_date::date
  ) INTO is_blackout;
  
  IF is_blackout THEN
    INSERT INTO appointment_conflicts (appointment_id, conflict_type, conflict_details)
    VALUES (NEW.id, 'blackout_date', '{"message": "Appointment scheduled on blackout date"}');
  END IF;
  
  -- Check workshop availability for the day of week
  SELECT * INTO availability_record
  FROM workshop_availability 
  WHERE workshop_id = NEW.workshop_id 
  AND day_of_week = EXTRACT(DOW FROM NEW.scheduled_date)
  AND NEW.scheduled_date::time BETWEEN start_time AND end_time
  AND is_available = true;
  
  IF NOT FOUND THEN
    INSERT INTO appointment_conflicts (appointment_id, conflict_type, conflict_details)
    VALUES (NEW.id, 'outside_hours', '{"message": "Appointment scheduled outside workshop hours"}');
  END IF;
  
  -- Check for capacity conflicts
  IF availability_record.max_concurrent_appointments IS NOT NULL THEN
    SELECT COUNT(*) INTO conflict_count
    FROM workshop_appointments
    WHERE workshop_id = NEW.workshop_id
    AND appointment_status IN ('scheduled', 'confirmed', 'in_progress')
    AND id != NEW.id
    AND (
      (scheduled_date <= NEW.scheduled_date AND scheduled_date + (duration_minutes || ' minutes')::interval > NEW.scheduled_date)
      OR
      (NEW.scheduled_date <= scheduled_date AND NEW.scheduled_date + (NEW.duration_minutes || ' minutes')::interval > scheduled_date)
    );
    
    IF conflict_count >= availability_record.max_concurrent_appointments THEN
      INSERT INTO appointment_conflicts (appointment_id, conflict_type, conflict_details)
      VALUES (NEW.id, 'capacity_exceeded', jsonb_build_object('concurrent_appointments', conflict_count, 'max_allowed', availability_record.max_concurrent_appointments));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointment conflict checking
CREATE TRIGGER check_appointment_conflicts_trigger
  AFTER INSERT OR UPDATE ON workshop_appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_conflicts();

-- Create function to update appointment timestamps
CREATE OR REPLACE FUNCTION update_appointment_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  IF NEW.appointment_status = 'confirmed' AND OLD.appointment_status != 'confirmed' THEN
    NEW.confirmed_at = now();
  END IF;
  
  IF NEW.appointment_status = 'completed' AND OLD.appointment_status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  
  IF NEW.appointment_status = 'cancelled' AND OLD.appointment_status != 'cancelled' THEN
    NEW.cancelled_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp updates
CREATE TRIGGER update_appointment_timestamps_trigger
  BEFORE UPDATE ON workshop_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_timestamps();
