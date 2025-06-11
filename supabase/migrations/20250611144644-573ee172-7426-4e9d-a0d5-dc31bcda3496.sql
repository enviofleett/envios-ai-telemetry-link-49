
-- Create SMS configurations table
CREATE TABLE IF NOT EXISTS public.sms_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_name TEXT NOT NULL DEFAULT 'mysms',
  api_username TEXT NOT NULL,
  api_password_encrypted TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  route INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SMS logs table
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'CUSTOM',
  status TEXT NOT NULL DEFAULT 'pending',
  provider_name TEXT NOT NULL DEFAULT 'mysms',
  provider_response JSONB DEFAULT '{}'::jsonb,
  cost_estimate NUMERIC(10,4) DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences update for SMS
ALTER TABLE public.user_email_preferences 
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_otp_verification BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_trip_updates BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_maintenance_alerts BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_violation_alerts BOOLEAN NOT NULL DEFAULT true;

-- Enable RLS on SMS tables (only if tables exist and don't have RLS)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sms_configurations' AND table_schema = 'public') THEN
        ALTER TABLE public.sms_configurations ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sms_logs' AND table_schema = 'public') THEN
        ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies only if they don't exist
DO $$
BEGIN
    -- SMS configurations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_configurations' AND policyname = 'Users can manage their own SMS configs') THEN
        CREATE POLICY "Users can manage their own SMS configs"
          ON public.sms_configurations
          FOR ALL
          USING (auth.uid() = user_id);
    END IF;

    -- SMS logs policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_logs' AND policyname = 'Users can view their own SMS logs') THEN
        CREATE POLICY "Users can view their own SMS logs"
          ON public.sms_logs
          FOR SELECT
          USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_logs' AND policyname = 'System can create SMS logs') THEN
        CREATE POLICY "System can create SMS logs"
          ON public.sms_logs
          FOR INSERT
          WITH CHECK (true);
    END IF;
END $$;

-- Create triggers for updated_at (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'sms_configurations_updated_at') THEN
        CREATE TRIGGER sms_configurations_updated_at
          BEFORE UPDATE ON public.sms_configurations
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add check constraints (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_event_type' AND table_name = 'sms_logs') THEN
        ALTER TABLE public.sms_logs 
        ADD CONSTRAINT valid_event_type 
        CHECK (event_type IN ('OTP', 'TRIP_UPDATE', 'MAINTENANCE', 'VIOLATION_ALERT', 'REGISTRATION', 'CUSTOM'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'valid_status' AND table_name = 'sms_logs') THEN
        ALTER TABLE public.sms_logs 
        ADD CONSTRAINT valid_status 
        CHECK (status IN ('pending', 'sent', 'failed', 'delivered', 'expired'));
    END IF;
END $$;
