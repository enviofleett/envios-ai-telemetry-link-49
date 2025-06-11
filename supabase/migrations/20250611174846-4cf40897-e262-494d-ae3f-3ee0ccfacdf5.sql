
-- Add missing columns to gp51_sessions table for proper authentication
ALTER TABLE public.gp51_sessions 
ADD COLUMN IF NOT EXISTS password_hash text,
ADD COLUMN IF NOT EXISTS api_url text DEFAULT 'https://www.gps51.com/webapi',
ADD COLUMN IF NOT EXISTS session_metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone DEFAULT now();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_gp51_sessions_user_activity ON public.gp51_sessions(envio_user_id, last_activity_at);

-- Update the trigger to handle session metadata
CREATE OR REPLACE FUNCTION update_gp51_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_gp51_session_activity ON public.gp51_sessions;
CREATE TRIGGER trigger_update_gp51_session_activity
  BEFORE UPDATE ON public.gp51_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_gp51_session_activity();

-- Ensure proper RLS policies for GP51 sessions
DROP POLICY IF EXISTS "Users can manage their own GP51 sessions" ON public.gp51_sessions;
CREATE POLICY "Users can manage their own GP51 sessions" ON public.gp51_sessions
  FOR ALL USING (
    auth.uid() = envio_user_id OR 
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
