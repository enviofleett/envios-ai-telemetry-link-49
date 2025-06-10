
-- Create SMTP configuration table
CREATE TABLE IF NOT EXISTS public.smtp_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_name TEXT NOT NULL DEFAULT 'custom',
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL,
  smtp_pass_encrypted TEXT NOT NULL,
  use_tls BOOLEAN NOT NULL DEFAULT true,
  use_ssl BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'notification',
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email notifications queue table
CREATE TABLE IF NOT EXISTS public.email_notification_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  sender_email TEXT,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT NOT NULL,
  template_id UUID,
  template_variables JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 5,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user email preferences table
CREATE TABLE IF NOT EXISTS public.user_email_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  vehicle_alerts BOOLEAN NOT NULL DEFAULT true,
  maintenance_reminders BOOLEAN NOT NULL DEFAULT true,
  system_updates BOOLEAN NOT NULL DEFAULT false,
  marketing_emails BOOLEAN NOT NULL DEFAULT false,
  weekly_reports BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.smtp_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for SMTP configurations
CREATE POLICY "Users can manage their own SMTP configs"
  ON public.smtp_configurations
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for email templates
CREATE POLICY "Users can manage their own email templates"
  ON public.email_templates
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for email queue
CREATE POLICY "Users can view their own email queue"
  ON public.email_notification_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage email queue"
  ON public.email_notification_queue
  FOR ALL
  USING (true);

-- Create RLS policies for email preferences
CREATE POLICY "Users can manage their own email preferences"
  ON public.user_email_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER smtp_configurations_updated_at
  BEFORE UPDATE ON public.smtp_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER email_notification_queue_updated_at
  BEFORE UPDATE ON public.email_notification_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_email_preferences_updated_at
  BEFORE UPDATE ON public.user_email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email templates
INSERT INTO public.email_templates (user_id, template_name, template_type, subject, body_text, variables) 
SELECT 
  auth.uid(),
  'Welcome Email',
  'welcome',
  'Welcome to Fleet Management - {{company_name}}',
  'Hello {{user_name}},

Welcome to our fleet management platform! We''re excited to have you on board.

Your account details:
- Email: {{user_email}}
- Company: {{company_name}}

If you have any questions, please don''t hesitate to contact our support team.

Best regards,
The Fleet Management Team',
  '["user_name", "user_email", "company_name"]'::jsonb
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
