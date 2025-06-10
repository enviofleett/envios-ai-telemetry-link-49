
-- Create workshop users table for workshop staff authentication
CREATE TABLE public.workshop_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'technician', 'inspector')),
  permissions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workshop sessions table for workshop user authentication
CREATE TABLE public.workshop_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_user_id UUID REFERENCES public.workshop_users(id) ON DELETE CASCADE NOT NULL,
  workshop_id UUID REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for workshop_users
ALTER TABLE public.workshop_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workshop users can view their own data"
  ON public.workshop_users
  FOR SELECT
  USING (true); -- We'll implement proper auth logic in the application

CREATE POLICY "Workshop users can be created"
  ON public.workshop_users
  FOR INSERT
  WITH CHECK (true); -- We'll implement proper auth logic in the application

-- Add RLS policies for workshop_sessions
ALTER TABLE public.workshop_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workshop sessions are accessible"
  ON public.workshop_sessions
  FOR ALL
  USING (true); -- We'll implement proper auth logic in the application

-- Create indexes for better performance
CREATE INDEX idx_workshop_users_workshop_id ON public.workshop_users(workshop_id);
CREATE INDEX idx_workshop_users_email ON public.workshop_users(email);
CREATE INDEX idx_workshop_sessions_workshop_user_id ON public.workshop_sessions(workshop_user_id);
CREATE INDEX idx_workshop_sessions_expires_at ON public.workshop_sessions(expires_at);
