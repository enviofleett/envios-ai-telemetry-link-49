
-- Phase 1: Database-Level Session Management Fix

-- First, let's modify the gp51_sessions table to support better session management
-- Add a session_fingerprint column to help identify unique sessions
ALTER TABLE public.gp51_sessions 
ADD COLUMN IF NOT EXISTS session_fingerprint text,
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Create an index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_gp51_sessions_username ON public.gp51_sessions(username);
CREATE INDEX IF NOT EXISTS idx_gp51_sessions_active ON public.gp51_sessions(is_active, token_expires_at);

-- Create a function to cleanup expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_gp51_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE public.gp51_sessions 
  SET is_active = false, updated_at = now()
  WHERE token_expires_at < now() AND is_active = true;
  
  -- Delete very old inactive sessions (older than 7 days)
  DELETE FROM public.gp51_sessions 
  WHERE is_active = false AND updated_at < now() - interval '7 days';
END;
$$;

-- Create a function to safely upsert GP51 sessions
CREATE OR REPLACE FUNCTION public.upsert_gp51_session(
  p_envio_user_id uuid,
  p_username text,
  p_password_hash text,
  p_gp51_token text,
  p_api_url text,
  p_token_expires_at timestamp with time zone,
  p_session_fingerprint text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id uuid;
BEGIN
  -- First cleanup expired sessions
  PERFORM public.cleanup_expired_gp51_sessions();
  
  -- Deactivate any existing sessions for this user
  UPDATE public.gp51_sessions 
  SET is_active = false, updated_at = now()
  WHERE envio_user_id = p_envio_user_id AND is_active = true;
  
  -- Insert new session
  INSERT INTO public.gp51_sessions (
    envio_user_id,
    username,
    password_hash,
    gp51_token,
    api_url,
    token_expires_at,
    session_fingerprint,
    is_active,
    created_at,
    updated_at,
    last_activity_at
  ) VALUES (
    p_envio_user_id,
    p_username,
    p_password_hash,
    p_gp51_token,
    p_api_url,
    p_token_expires_at,
    p_session_fingerprint,
    true,
    now(),
    now(),
    now()
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Create a trigger to update last_activity_at automatically
CREATE OR REPLACE FUNCTION public.update_gp51_session_activity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_gp51_session_activity_trigger ON public.gp51_sessions;
CREATE TRIGGER update_gp51_session_activity_trigger
BEFORE UPDATE ON public.gp51_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_gp51_session_activity();

-- Add RLS policies for the new columns
CREATE POLICY "Users can manage their own sessions with new columns" ON public.gp51_sessions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR envio_user_id = auth.uid()
);
