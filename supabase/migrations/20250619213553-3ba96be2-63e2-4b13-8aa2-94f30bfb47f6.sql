
-- Create vehicle positions table for real-time tracking
CREATE TABLE IF NOT EXISTS public.vehicle_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0,
  heading INTEGER DEFAULT 0,
  altitude DECIMAL(7, 2),
  accuracy DECIMAL(5, 2),
  timestamp TIMESTAMPTZ NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_vehicle_id ON public.vehicle_positions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_device_id ON public.vehicle_positions(device_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_timestamp ON public.vehicle_positions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_positions_created_at ON public.vehicle_positions(created_at DESC);

-- Create vehicle trails table for history visualization
CREATE TABLE IF NOT EXISTS public.vehicle_trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  trail_points JSONB NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_distance DECIMAL(8, 2) DEFAULT 0,
  total_duration_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for vehicle trails
CREATE INDEX IF NOT EXISTS idx_vehicle_trails_vehicle_id ON public.vehicle_trails(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_trails_device_id ON public.vehicle_trails(device_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_trails_start_time ON public.vehicle_trails(start_time DESC);

-- Create real-time connection tracking table
CREATE TABLE IF NOT EXISTS public.realtime_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  connection_id TEXT UNIQUE NOT NULL,
  vehicle_filters JSONB DEFAULT '{}',
  last_ping TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for connection tracking
CREATE INDEX IF NOT EXISTS idx_realtime_connections_user_id ON public.realtime_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_connections_last_ping ON public.realtime_connections(last_ping DESC);

-- Enable Row Level Security
ALTER TABLE public.vehicle_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_connections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vehicle_positions
CREATE POLICY "Users can view vehicle positions they have access to" 
  ON public.vehicle_positions FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v 
      WHERE v.id = vehicle_positions.vehicle_id 
      AND (v.user_id = auth.uid() OR auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = 'admin'
      ))
    )
  );

CREATE POLICY "System can insert vehicle positions" 
  ON public.vehicle_positions FOR INSERT 
  WITH CHECK (true);

-- Create RLS policies for vehicle_trails
CREATE POLICY "Users can view vehicle trails they have access to" 
  ON public.vehicle_trails FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v 
      WHERE v.id = vehicle_trails.vehicle_id 
      AND (v.user_id = auth.uid() OR auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = 'admin'
      ))
    )
  );

CREATE POLICY "System can manage vehicle trails" 
  ON public.vehicle_trails FOR ALL 
  USING (true);

-- Create RLS policies for realtime_connections
CREATE POLICY "Users can manage their own connections" 
  ON public.realtime_connections FOR ALL 
  USING (auth.uid() = user_id);

-- Enable realtime for the new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_trails;

-- Set replica identity for realtime
ALTER TABLE public.vehicle_positions REPLICA IDENTITY FULL;
ALTER TABLE public.vehicle_trails REPLICA IDENTITY FULL;
ALTER TABLE public.realtime_connections REPLICA IDENTITY FULL;

-- Create function to clean up old position data (keep last 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_vehicle_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.vehicle_positions 
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  DELETE FROM public.vehicle_trails 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  DELETE FROM public.realtime_connections 
  WHERE last_ping < NOW() - INTERVAL '1 hour';
END;
$$;
