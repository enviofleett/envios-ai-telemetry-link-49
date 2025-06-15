
-- Create a table to store individual parking events
CREATE TABLE public.vehicle_parking_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_device_id TEXT NOT NULL REFERENCES public.vehicles(device_id) ON DELETE CASCADE,
  parked_at TIMESTAMPTZ NOT NULL,
  unparked_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  is_night_parking BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.vehicle_parking_events IS 'Stores individual parking events for vehicles, including location and duration.';
COMMENT ON COLUMN public.vehicle_parking_events.is_night_parking IS 'True if parking occurred between 6 PM and 6 AM vehicle local time.';

-- Create a table to store learned parking patterns
CREATE TABLE public.vehicle_parking_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_device_id TEXT NOT NULL REFERENCES public.vehicles(device_id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  parking_count INTEGER NOT NULL DEFAULT 1,
  is_primary_night_location BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.vehicle_parking_patterns IS 'Stores aggregated, learned parking patterns for each vehicle.';
COMMENT ON COLUMN public.vehicle_parking_patterns.is_primary_night_location IS 'Identifies the most frequent overnight parking location.';

-- Add indexes for better query performance
CREATE INDEX idx_vehicle_parking_events_vehicle_id_parked_at ON public.vehicle_parking_events(vehicle_device_id, parked_at DESC);
CREATE INDEX idx_vehicle_parking_patterns_vehicle_id ON public.vehicle_parking_patterns(vehicle_device_id);

-- Trigger to automatically update the 'updated_at' timestamp on pattern changes
CREATE TRIGGER set_parking_patterns_timestamp
BEFORE UPDATE ON public.vehicle_parking_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security to protect the data
ALTER TABLE public.vehicle_parking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_parking_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policy for parking events: Users can only access events for vehicles assigned to them.
CREATE POLICY "Users can manage parking events for their assigned vehicles"
ON public.vehicle_parking_events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.device_id = vehicle_parking_events.vehicle_device_id AND v.envio_user_id = auth.uid()
  )
);

-- RLS policy for parking patterns: Users can only access patterns for vehicles assigned to them.
CREATE POLICY "Users can manage parking patterns for their assigned vehicles"
ON public.vehicle_parking_patterns
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.device_id = vehicle_parking_patterns.vehicle_device_id AND v.envio_user_id = auth.uid()
  )
);
