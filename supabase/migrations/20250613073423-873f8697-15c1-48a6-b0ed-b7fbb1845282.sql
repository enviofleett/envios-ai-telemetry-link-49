
-- First, let's make the body_text column nullable temporarily to allow our inserts
ALTER TABLE public.email_templates ALTER COLUMN body_text DROP NOT NULL;

-- Create email_themes table for customizable email styling
CREATE TABLE IF NOT EXISTS public.email_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  header_html TEXT,
  footer_html TEXT,
  styles_css TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email_delivery_logs table for tracking email status
CREATE TABLE IF NOT EXISTS public.email_delivery_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_template_id UUID REFERENCES public.email_templates(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  trigger_type TEXT,
  related_entity_id TEXT,
  template_variables JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhance email_templates table with new columns
ALTER TABLE public.email_templates 
ADD COLUMN IF NOT EXISTS trigger_type TEXT,
ADD COLUMN IF NOT EXISTS selected_theme_id UUID REFERENCES public.email_themes(id),
ADD COLUMN IF NOT EXISTS html_body_template TEXT,
ADD COLUMN IF NOT EXISTS text_body_template TEXT;

-- Update existing templates to use new structure if needed
UPDATE public.email_templates 
SET html_body_template = COALESCE(body_html, body_text),
    text_body_template = body_text,
    body_text = COALESCE(body_text, body_html, 'Default email content')
WHERE html_body_template IS NULL OR text_body_template IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_recipient ON public.email_delivery_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_status ON public.email_delivery_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_trigger_type ON public.email_delivery_logs(trigger_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_trigger_type ON public.email_templates(trigger_type);

-- Enable RLS on new tables
ALTER TABLE public.email_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_delivery_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_themes
CREATE POLICY "Users can view active email themes"
  ON public.email_themes
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can manage their email themes"
  ON public.email_themes
  FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create RLS policies for email_delivery_logs
CREATE POLICY "Users can view their own email delivery logs"
  ON public.email_delivery_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage email delivery logs"
  ON public.email_delivery_logs
  FOR ALL
  USING (true);

-- Add triggers for updated_at
CREATE TRIGGER email_themes_updated_at
  BEFORE UPDATE ON public.email_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER email_delivery_logs_updated_at
  BEFORE UPDATE ON public.email_delivery_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default email themes
INSERT INTO public.email_themes (name, description, header_html, footer_html, styles_css) VALUES
(
  'Default Envio',
  'Professional default theme with Envio branding',
  '<div style="background-color: #1f2937; padding: 20px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-family: Arial, sans-serif;">FleetIQ</h1>
    <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 14px;">Professional Vehicle Management</p>
  </div>',
  '<div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
    <p>© 2024 FleetIQ. All rights reserved.</p>
    <p>This is an automated message from your fleet management system.</p>
  </div>',
  'body { font-family: Arial, sans-serif; line-height: 1.6; color: #374151; }
   .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
   .content { padding: 30px; }
   h2 { color: #1f2937; margin-bottom: 20px; }
   .button { background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
   .alert { padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 20px 0; }'
),
(
  'Modern Clean',
  'Clean and minimalist design with modern styling',
  '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: #ffffff; margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 300;">FleetIQ</h1>
  </div>',
  '<div style="background-color: #ffffff; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0; font-size: 14px; color: #6b7280;">FleetIQ - Smart Fleet Management Solutions</p>
  </div>',
  'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.7; color: #1f2937; }
   .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
   .content { padding: 40px; }
   h2 { color: #1f2937; margin-bottom: 24px; font-weight: 600; }
   .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500; }
   .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }'
),
(
  'Professional Dark',
  'Sophisticated dark theme for premium communications',
  '<div style="background-color: #111827; padding: 25px; text-align: center; border-bottom: 3px solid #3b82f6;">
    <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-weight: normal;">FleetIQ</h1>
    <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 13px; letter-spacing: 1px;">PROFESSIONAL FLEET MANAGEMENT</p>
  </div>',
  '<div style="background-color: #1f2937; padding: 25px; text-align: center;">
    <p style="margin: 0; font-size: 13px; color: #9ca3af;">Confidential and Proprietary | FleetIQ Systems</p>
    <p style="margin: 5px 0 0 0; font-size: 12px; color: #6b7280;">This communication contains privileged information.</p>
  </div>',
  'body { font-family: Georgia, "Times New Roman", serif; line-height: 1.6; color: #d1d5db; background-color: #374151; }
   .container { max-width: 600px; margin: 0 auto; background-color: #374151; }
   .content { padding: 35px; background-color: #374151; }
   h2 { color: #f9fafb; margin-bottom: 22px; font-weight: normal; }
   .button { background-color: #3b82f6; color: white; padding: 12px 26px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; }
   .highlight { background-color: #1f2937; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 0 4px 4px 0; }'
)
ON CONFLICT DO NOTHING;

-- Insert default email templates with trigger types - now including body_text for compatibility
INSERT INTO public.email_templates (
  user_id, template_name, template_type, trigger_type, subject, 
  body_text, html_body_template, text_body_template, selected_theme_id, variables
) 
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'User Registration Welcome',
  'notification',
  'user_registration',
  'Welcome to FleetIQ - {{company_name}}',
  'Welcome to FleetIQ, {{user_name}}!

We''re excited to have you join our fleet management platform. Your account has been successfully created.

Account Details:
- Email: {{user_email}}
- Company: {{company_name}}
- Registration Date: {{registration_date}}

To get started, please verify your email address by visiting: {{verification_link}}

If you have any questions, please don''t hesitate to contact our support team.

Best regards,
The FleetIQ Team',
  '<div class="content">
    <h2>Welcome to FleetIQ, {{user_name}}!</h2>
    <p>We''re excited to have you join our fleet management platform. Your account has been successfully created.</p>
    <div class="info-box">
      <h3>Account Details:</h3>
      <p><strong>Email:</strong> {{user_email}}</p>
      <p><strong>Company:</strong> {{company_name}}</p>
      <p><strong>Registration Date:</strong> {{registration_date}}</p>
    </div>
    <p>To get started, please verify your email address by clicking the button below:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{verification_link}}" class="button">Verify Email Address</a>
    </p>
    <p>If you have any questions, please don''t hesitate to contact our support team.</p>
    <p>Best regards,<br>The FleetIQ Team</p>
  </div>',
  'Welcome to FleetIQ, {{user_name}}!

We''re excited to have you join our fleet management platform. Your account has been successfully created.

Account Details:
- Email: {{user_email}}
- Company: {{company_name}}
- Registration Date: {{registration_date}}

To get started, please verify your email address by visiting: {{verification_link}}

If you have any questions, please don''t hesitate to contact our support team.

Best regards,
The FleetIQ Team',
  (SELECT id FROM public.email_themes WHERE name = 'Default Envio' LIMIT 1),
  '["user_name", "user_email", "company_name", "registration_date", "verification_link"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE trigger_type = 'user_registration');

INSERT INTO public.email_templates (
  user_id, template_name, template_type, trigger_type, subject,
  body_text, html_body_template, text_body_template, selected_theme_id, variables
)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Password Reset Request',
  'notification', 
  'password_reset',
  'Reset Your FleetIQ Password',
  'Password Reset Request

Hello {{user_name}},

We received a request to reset your FleetIQ account password. If you made this request, please visit the following link to reset your password:

{{reset_link}}

Security Notice: This link will expire in {{expiry_hours}} hours for your security.

If you didn''t request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
The FleetIQ Security Team',
  '<div class="content">
    <h2>Password Reset Request</h2>
    <p>Hello {{user_name}},</p>
    <p>We received a request to reset your FleetIQ account password. If you made this request, click the button below to reset your password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{reset_link}}" class="button">Reset Password</a>
    </p>
    <div class="alert">
      <strong>Security Notice:</strong> This link will expire in {{expiry_hours}} hours for your security.
    </div>
    <p>If you didn''t request this password reset, please ignore this email or contact support if you have concerns.</p>
    <p>Best regards,<br>The FleetIQ Security Team</p>
  </div>',
  'Password Reset Request

Hello {{user_name}},

We received a request to reset your FleetIQ account password. If you made this request, please visit the following link to reset your password:

{{reset_link}}

Security Notice: This link will expire in {{expiry_hours}} hours for your security.

If you didn''t request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
The FleetIQ Security Team',
  (SELECT id FROM public.email_themes WHERE name = 'Professional Dark' LIMIT 1),
  '["user_name", "reset_link", "expiry_hours"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE trigger_type = 'password_reset');

INSERT INTO public.email_templates (
  user_id, template_name, template_type, trigger_type, subject,
  body_text, html_body_template, text_body_template, selected_theme_id, variables  
)
SELECT 
  (SELECT id FROM auth.users LIMIT 1),
  'Vehicle Offline Alert',
  'alert',
  'vehicle_offline_alert', 
  'Vehicle Alert: {{vehicle_name}} is Offline',
  'Vehicle Offline Alert

Vehicle: {{vehicle_name}} ({{device_id}})
Last Contact: {{last_contact_time}}
Location: {{last_known_location}}

Your vehicle has been offline for longer than expected. This may indicate:
- GPS device connectivity issues  
- Vehicle power problems
- Coverage area limitations

Please check the vehicle status and contact support if the issue persists.

View vehicle details: {{vehicle_details_link}}',
  '<div class="content">
    <h2>Vehicle Offline Alert</h2>
    <div class="alert">
      <strong>Vehicle:</strong> {{vehicle_name}} ({{device_id}})<br>
      <strong>Last Contact:</strong> {{last_contact_time}}<br>
      <strong>Location:</strong> {{last_known_location}}
    </div>
    <p>Your vehicle has been offline for longer than expected. This may indicate:</p>
    <ul>
      <li>GPS device connectivity issues</li>
      <li>Vehicle power problems</li>
      <li>Coverage area limitations</li>
    </ul>
    <p>Please check the vehicle status and contact support if the issue persists.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{vehicle_details_link}}" class="button">View Vehicle Details</a>
    </p>
  </div>',
  'Vehicle Offline Alert

Vehicle: {{vehicle_name}} ({{device_id}})
Last Contact: {{last_contact_time}}
Location: {{last_known_location}}

Your vehicle has been offline for longer than expected. This may indicate:
- GPS device connectivity issues  
- Vehicle power problems
- Coverage area limitations

Please check the vehicle status and contact support if the issue persists.

View vehicle details: {{vehicle_details_link}}',
  (SELECT id FROM public.email_themes WHERE name = 'Modern Clean' LIMIT 1),
  '["vehicle_name", "device_id", "last_contact_time", "last_known_location", "vehicle_details_link"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.email_templates WHERE trigger_type = 'vehicle_offline_alert');
