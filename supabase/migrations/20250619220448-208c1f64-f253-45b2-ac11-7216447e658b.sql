
-- Create geofences table for storing geofence definitions
CREATE TABLE IF NOT EXISTS public.geofences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.envio_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  geometry JSONB NOT NULL, -- GeoJSON polygon/circle data
  fence_type TEXT NOT NULL DEFAULT 'inclusion' CHECK (fence_type IN ('inclusion', 'exclusion')),
  is_active BOOLEAN DEFAULT true,
  alert_on_enter BOOLEAN DEFAULT true,
  alert_on_exit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create geofence alerts table for tracking violations
CREATE TABLE IF NOT EXISTS public.geofence_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geofence_id UUID REFERENCES public.geofences(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('enter', 'exit')),
  triggered_at TIMESTAMPTZ NOT NULL,
  location JSONB NOT NULL, -- {lat, lng} of where alert was triggered
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES public.envio_users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification preferences for geofence alerts
CREATE TABLE IF NOT EXISTS public.geofence_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.envio_users(id) ON DELETE CASCADE,
  geofence_id UUID REFERENCES public.geofences(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'push')),
  is_enabled BOOLEAN DEFAULT true,
  recipient_contact TEXT NOT NULL, -- email address or phone number
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, geofence_id, notification_type, recipient_contact)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_geofences_created_by ON public.geofences(created_by);
CREATE INDEX IF NOT EXISTS idx_geofences_active ON public.geofences(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_geofence_alerts_device_id ON public.geofence_alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_geofence_alerts_triggered_at ON public.geofence_alerts(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_geofence_alerts_unacknowledged ON public.geofence_alerts(is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_geofence_notification_preferences_user_id ON public.geofence_notification_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geofence_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for geofences
CREATE POLICY "Users can manage their own geofences" 
  ON public.geofences FOR ALL 
  USING (
    created_by IN (
      SELECT id FROM public.envio_users WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- RLS Policies for geofence alerts  
CREATE POLICY "Users can view alerts for their geofences" 
  ON public.geofence_alerts FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.geofences g 
      JOIN public.envio_users eu ON g.created_by = eu.id
      WHERE g.id = geofence_alerts.geofence_id 
      AND eu.email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "Users can acknowledge their geofence alerts" 
  ON public.geofence_alerts FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.geofences g 
      JOIN public.envio_users eu ON g.created_by = eu.id
      WHERE g.id = geofence_alerts.geofence_id 
      AND eu.email = (auth.jwt() ->> 'email')
    )
  );

CREATE POLICY "System can create geofence alerts" 
  ON public.geofence_alerts FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
  ON public.geofence_notification_preferences FOR ALL 
  USING (
    user_id IN (
      SELECT id FROM public.envio_users WHERE email = (auth.jwt() ->> 'email')
    )
  );

-- Enable realtime for geofence alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.geofence_alerts;
ALTER TABLE public.geofence_alerts REPLICA IDENTITY FULL;

-- Create trigger to update updated_at timestamp for geofences
CREATE OR REPLACE FUNCTION update_geofence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_geofences_updated_at
  BEFORE UPDATE ON public.geofences
  FOR EACH ROW
  EXECUTE FUNCTION update_geofence_updated_at();
