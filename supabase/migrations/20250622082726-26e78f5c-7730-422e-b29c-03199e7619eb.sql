
-- Create enum types for user management (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE public.registration_status AS ENUM ('pending', 'approved', 'rejected', 'verified');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.authentication_method AS ENUM ('password', 'otp', 'social', 'gp51');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create pending registrations table
CREATE TABLE IF NOT EXISTS public.pending_user_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone_number TEXT,
  company_name TEXT,
  city TEXT,
  country_code TEXT DEFAULT 'US',
  selected_package_id UUID REFERENCES public.packages(id),
  registration_data JSONB DEFAULT '{}'::jsonb,
  status public.registration_status DEFAULT 'pending',
  otp_verified_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create OTP verifications table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'registration',
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user authentication logs
CREATE TABLE IF NOT EXISTS public.user_authentication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  authentication_method public.authentication_method,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.pending_user_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_authentication_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pending registrations (admin only)
CREATE POLICY "Admins can manage pending registrations" ON public.pending_user_registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for OTP verifications (service only)
CREATE POLICY "Service can manage OTP verifications" ON public.otp_verifications
  FOR ALL USING (true);

-- Create RLS policies for authentication logs (admins and own records)
CREATE POLICY "Users can view own auth logs" ON public.user_authentication_logs
  FOR SELECT USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON public.pending_user_registrations(email);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_status ON public.pending_user_registrations(status);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email ON public.otp_verifications(email);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires ON public.otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON public.user_authentication_logs(user_id);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_pending_registrations_updated_at BEFORE UPDATE ON public.pending_user_registrations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
