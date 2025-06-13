
-- Create the gp51_sessions table with all required fields (if not exists)
CREATE TABLE IF NOT EXISTS public.gp51_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  gp51_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  api_url TEXT NOT NULL DEFAULT 'https://www.gps51.com/webapi',
  envio_user_id UUID REFERENCES public.envio_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure unique username per session (prevent duplicates)
  UNIQUE(username)
);

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'gp51_sessions' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.gp51_sessions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies if they don't exist
DO $$
BEGIN
  -- Users can view their own GP51 sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gp51_sessions' 
    AND policyname = 'Users can view their own GP51 sessions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view their own GP51 sessions" 
      ON public.gp51_sessions 
      FOR SELECT 
      USING (envio_user_id = auth.uid() OR auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = ''admin''
      ))';
  END IF;

  -- Users can create their own GP51 sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gp51_sessions' 
    AND policyname = 'Users can create their own GP51 sessions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create their own GP51 sessions" 
      ON public.gp51_sessions 
      FOR INSERT 
      WITH CHECK (envio_user_id = auth.uid() OR auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = ''admin''
      ))';
  END IF;

  -- Users can update their own GP51 sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gp51_sessions' 
    AND policyname = 'Users can update their own GP51 sessions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update their own GP51 sessions" 
      ON public.gp51_sessions 
      FOR UPDATE 
      USING (envio_user_id = auth.uid() OR auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = ''admin''
      ))';
  END IF;

  -- Users can delete their own GP51 sessions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gp51_sessions' 
    AND policyname = 'Users can delete their own GP51 sessions'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete their own GP51 sessions" 
      ON public.gp51_sessions 
      FOR DELETE 
      USING (envio_user_id = auth.uid() OR auth.uid() IN (
        SELECT user_id FROM public.user_roles WHERE role = ''admin''
      ))';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_gp51_sessions_username ON public.gp51_sessions(username);
CREATE INDEX IF NOT EXISTS idx_gp51_sessions_user_id ON public.gp51_sessions(envio_user_id);
CREATE INDEX IF NOT EXISTS idx_gp51_sessions_expires_at ON public.gp51_sessions(token_expires_at);

-- Add helpful comments
COMMENT ON TABLE public.gp51_sessions IS 'Stores GP51 API credentials and session tokens for telemetry system integration';
COMMENT ON COLUMN public.gp51_sessions.password_hash IS 'GP51 API password - consider using Supabase Secrets for enhanced security in production';
COMMENT ON COLUMN public.gp51_sessions.token_expires_at IS 'Expiration timestamp for GP51 session token validation';
COMMENT ON COLUMN public.gp51_sessions.api_url IS 'Base URL for GP51 Web API, defaults to https://www.gps51.com/webapi';
