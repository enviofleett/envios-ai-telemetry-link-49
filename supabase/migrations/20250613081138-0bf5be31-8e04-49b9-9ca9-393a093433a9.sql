
-- Create the smtp_settings table
CREATE TABLE IF NOT EXISTS public.smtp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_username TEXT NOT NULL,
  smtp_password TEXT NOT NULL,
  smtp_encryption TEXT NOT NULL DEFAULT 'tls',
  is_active BOOLEAN NOT NULL DEFAULT false,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can manage SMTP settings" 
  ON public.smtp_settings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create enum type for email campaign types (with proper error handling)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_type_enum') THEN
    CREATE TYPE campaign_type_enum AS ENUM ('one_time', 'recurring', 'event_based');
  END IF;
END $$;

-- Update email_campaigns table to use the enum if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_campaigns') THEN
    -- Remove the default value first
    ALTER TABLE public.email_campaigns ALTER COLUMN campaign_type DROP DEFAULT;
    
    -- Convert the column type
    ALTER TABLE public.email_campaigns 
    ALTER COLUMN campaign_type TYPE campaign_type_enum 
    USING campaign_type::campaign_type_enum;
    
    -- Add back the default value with the enum type
    ALTER TABLE public.email_campaigns 
    ALTER COLUMN campaign_type SET DEFAULT 'one_time'::campaign_type_enum;
  END IF;
END $$;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_smtp_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER smtp_settings_updated_at
  BEFORE UPDATE ON public.smtp_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_smtp_settings_updated_at();
