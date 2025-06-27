
-- Phase 1: Database Schema Fixes and Missing RPC Functions

-- Create missing RPC function for getting active GP51 sessions
CREATE OR REPLACE FUNCTION public.get_active_gp51_session(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  gp51_username text,
  gp51_token text,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.id,
    gs.envio_user_id as user_id,
    gs.username as gp51_username,
    gs.gp51_token,
    gs.created_at,
    gs.token_expires_at as expires_at,
    gs.is_active
  FROM public.gp51_sessions gs
  WHERE gs.envio_user_id = p_user_id 
    AND gs.is_active = true 
    AND gs.token_expires_at > now()
  ORDER BY gs.created_at DESC
  LIMIT 1;
END;
$$;

-- Create missing RPC function for getting cached positions
CREATE OR REPLACE FUNCTION public.get_cached_positions(p_user_id uuid, p_device_ids text[] DEFAULT NULL)
RETURNS TABLE (
  device_id text,
  latitude double precision,
  longitude double precision,
  speed double precision,
  course integer,
  altitude double precision,
  device_time timestamp with time zone,
  server_time timestamp with time zone,
  status integer,
  moving integer,
  gps_source text,
  battery integer,
  signal integer,
  satellites integer,
  created_at timestamp with time zone,
  raw_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_device_ids IS NULL OR array_length(p_device_ids, 1) = 0 THEN
    RETURN QUERY
    SELECT 
      gp.device_id,
      gp.latitude,
      gp.longitude,
      gp.speed,
      gp.course,
      gp.altitude,
      gp.device_time,
      gp.server_time,
      gp.status,
      gp.moving,
      gp.gps_source,
      gp.battery,
      gp.signal,
      gp.satellites,
      gp.created_at,
      gp.raw_data
    FROM public.gp51_positions gp
    WHERE gp.user_id = p_user_id
    ORDER BY gp.created_at DESC
    LIMIT 1000;
  ELSE
    RETURN QUERY
    SELECT 
      gp.device_id,
      gp.latitude,
      gp.longitude,
      gp.speed,
      gp.course,
      gp.altitude,
      gp.device_time,
      gp.server_time,
      gp.status,
      gp.moving,
      gp.gps_source,
      gp.battery,
      gp.signal,
      gp.satellites,
      gp.created_at,
      gp.raw_data
    FROM public.gp51_positions gp
    WHERE gp.user_id = p_user_id 
      AND gp.device_id = ANY(p_device_ids)
    ORDER BY gp.created_at DESC
    LIMIT 1000;
  END IF;
END;
$$;

-- Ensure gp51_positions table exists with proper structure
CREATE TABLE IF NOT EXISTS public.gp51_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  latitude double precision,
  longitude double precision,
  speed double precision,
  course integer,
  altitude double precision,
  device_time timestamp with time zone,
  server_time timestamp with time zone DEFAULT now(),
  status integer,
  moving integer,
  gps_source text,
  battery integer,
  signal integer,
  satellites integer,
  created_at timestamp with time zone DEFAULT now(),
  raw_data jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gp51_positions_user_device 
ON public.gp51_positions(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_gp51_positions_device_time 
ON public.gp51_positions(device_time DESC);

-- Enable RLS on gp51_positions if not already enabled
ALTER TABLE public.gp51_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for gp51_positions
DROP POLICY IF EXISTS "Users can manage their own GP51 positions" ON public.gp51_positions;
CREATE POLICY "Users can manage their own GP51 positions" ON public.gp51_positions
FOR ALL USING (auth.uid() = user_id);

-- Enable realtime for live position updates
ALTER TABLE public.gp51_positions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gp51_positions;
