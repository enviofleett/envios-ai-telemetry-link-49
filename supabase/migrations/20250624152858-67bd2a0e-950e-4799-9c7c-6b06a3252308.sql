
-- Add the missing is_active column to the gp51_sessions table
ALTER TABLE public.gp51_sessions 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.gp51_sessions.is_active IS 'Indicates whether the GP51 session is currently active and usable';

-- Create an index on is_active for better query performance when filtering active sessions
CREATE INDEX IF NOT EXISTS idx_gp51_sessions_is_active ON public.gp51_sessions(is_active);
