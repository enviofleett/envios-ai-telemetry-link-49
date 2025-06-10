
-- Create comprehensive email templates table with enhanced features
CREATE TABLE IF NOT EXISTS public.enhanced_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL,
  template_category TEXT NOT NULL DEFAULT 'fleet_operations',
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_system_template BOOLEAN NOT NULL DEFAULT true,
  placeholders JSONB DEFAULT '[]'::jsonb,
  template_variables JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1,
  language_code TEXT DEFAULT 'en',
  priority_level TEXT DEFAULT 'medium',
  auto_send_conditions JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.enhanced_email_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for enhanced email templates
CREATE POLICY "Admin can manage enhanced email templates"
  ON public.enhanced_email_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create admin email test logs table
CREATE TABLE IF NOT EXISTS public.admin_email_test_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  template_id UUID,
  test_type TEXT NOT NULL DEFAULT 'single',
  recipient_emails TEXT[] NOT NULL,
  test_data JSONB DEFAULT '{}'::jsonb,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  test_results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for admin email test logs
ALTER TABLE public.admin_email_test_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admin email test logs
CREATE POLICY "Admin can manage email test logs"
  ON public.admin_email_test_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create email automation rules table
CREATE TABLE IF NOT EXISTS public.email_automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions JSONB DEFAULT '{}'::jsonb,
  template_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  delay_minutes INTEGER DEFAULT 0,
  recipient_logic JSONB DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for email automation rules
ALTER TABLE public.email_automation_rules ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for email automation rules
CREATE POLICY "Admin can manage email automation rules"
  ON public.email_automation_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert comprehensive fleet management email templates
INSERT INTO public.enhanced_email_templates (template_type, template_category, template_name, subject, body_html, body_text, placeholders, template_variables, priority_level) VALUES
-- Vehicle Management Templates
('vehicle_registration', 'vehicle_management', 'Vehicle Registration Confirmation', 'Vehicle {{vehicle_name}} Successfully Registered', 
'<h2>Vehicle Registration Confirmation</h2><p>Your vehicle <strong>{{vehicle_name}}</strong> ({{device_id}}) has been successfully registered to your fleet.</p><p><strong>Registration Details:</strong></p><ul><li>Vehicle Name: {{vehicle_name}}</li><li>Device ID: {{device_id}}</li><li>Registration Date: {{registration_date}}</li><li>Status: {{status}}</li></ul><p>You can now track and manage this vehicle through your dashboard.</p>',
'Vehicle {{vehicle_name}} ({{device_id}}) has been successfully registered. Registration Date: {{registration_date}}. Status: {{status}}.',
'["vehicle_name", "device_id", "registration_date", "status"]'::jsonb, '{}'::jsonb, 'medium'),

('vehicle_activation', 'vehicle_management', 'Vehicle Activation Alert', 'Vehicle {{vehicle_name}} is Now Active', 
'<h2>Vehicle Activation</h2><p>Vehicle <strong>{{vehicle_name}}</strong> has been activated and is now online.</p><p><strong>Activation Details:</strong></p><ul><li>Vehicle: {{vehicle_name}}</li><li>Device ID: {{device_id}}</li><li>Activated At: {{activation_time}}</li><li>Location: {{last_location}}</li></ul>',
'Vehicle {{vehicle_name}} ({{device_id}}) is now active. Activated at {{activation_time}}. Location: {{last_location}}.',
'["vehicle_name", "device_id", "activation_time", "last_location"]'::jsonb, '{}'::jsonb, 'medium'),

('vehicle_offline', 'vehicle_management', 'Vehicle Offline Alert', 'ALERT: {{vehicle_name}} has gone offline', 
'<div style="background-color: #fee; padding: 20px; border-left: 4px solid #f00;"><h2 style="color: #d00;">Vehicle Offline Alert</h2><p><strong>{{vehicle_name}}</strong> has gone offline and requires immediate attention.</p><p><strong>Details:</strong></p><ul><li>Vehicle: {{vehicle_name}}</li><li>Device ID: {{device_id}}</li><li>Last Seen: {{last_seen}}</li><li>Duration Offline: {{offline_duration}}</li><li>Last Location: {{last_location}}</li></ul><p style="color: #d00;"><strong>Action Required:</strong> Please check the vehicle status and investigate the cause.</p></div>',
'ALERT: {{vehicle_name}} ({{device_id}}) has gone offline. Last seen: {{last_seen}}. Duration: {{offline_duration}}. Last location: {{last_location}}.',
'["vehicle_name", "device_id", "last_seen", "offline_duration", "last_location"]'::jsonb, '{}'::jsonb, 'high'),

('battery_low', 'vehicle_management', 'Low Battery Warning', 'Low Battery: {{vehicle_name}} - {{battery_level}}%', 
'<div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107;"><h2 style="color: #856404;">Low Battery Warning</h2><p>Vehicle <strong>{{vehicle_name}}</strong> has a low battery level.</p><p><strong>Battery Details:</strong></p><ul><li>Vehicle: {{vehicle_name}}</li><li>Current Level: {{battery_level}}%</li><li>Estimated Time Remaining: {{estimated_time}}</li><li>Last Update: {{last_update}}</li></ul><p><strong>Recommendation:</strong> Schedule maintenance to replace or charge the battery.</p></div>',
'Low Battery Warning: {{vehicle_name}} battery level is {{battery_level}}%. Estimated time remaining: {{estimated_time}}.',
'["vehicle_name", "battery_level", "estimated_time", "last_update"]'::jsonb, '{}'::jsonb, 'medium'),

-- Fleet Operations Templates
('geofence_entry', 'fleet_operations', 'Geofence Entry Alert', '{{vehicle_name}} entered {{geofence_name}}', 
'<h2>Geofence Entry Alert</h2><p>Vehicle <strong>{{vehicle_name}}</strong> has entered the geofence area <strong>{{geofence_name}}</strong>.</p><p><strong>Entry Details:</strong></p><ul><li>Vehicle: {{vehicle_name}}</li><li>Geofence: {{geofence_name}}</li><li>Entry Time: {{entry_time}}</li><li>Location: {{location}}</li><li>Speed: {{speed}} km/h</li></ul>',
'Vehicle {{vehicle_name}} entered geofence {{geofence_name}} at {{entry_time}}. Location: {{location}}. Speed: {{speed}} km/h.',
'["vehicle_name", "geofence_name", "entry_time", "location", "speed"]'::jsonb, '{}'::jsonb, 'medium'),

('speed_violation', 'fleet_operations', 'Speed Violation Alert', 'SPEED VIOLATION: {{vehicle_name}} - {{current_speed}} km/h', 
'<div style="background-color: #fee; padding: 20px; border-left: 4px solid #dc3545;"><h2 style="color: #dc3545;">Speed Violation Alert</h2><p><strong>{{vehicle_name}}</strong> has exceeded the speed limit.</p><p><strong>Violation Details:</strong></p><ul><li>Vehicle: {{vehicle_name}}</li><li>Current Speed: {{current_speed}} km/h</li><li>Speed Limit: {{speed_limit}} km/h</li><li>Location: {{location}}</li><li>Time: {{violation_time}}</li><li>Driver: {{driver_name}}</li></ul><p style="color: #dc3545;"><strong>Immediate Action Required</strong></p></div>',
'SPEED VIOLATION: {{vehicle_name}} traveling at {{current_speed}} km/h in {{speed_limit}} km/h zone. Location: {{location}}. Time: {{violation_time}}.',
'["vehicle_name", "current_speed", "speed_limit", "location", "violation_time", "driver_name"]'::jsonb, '{}'::jsonb, 'critical'),

('panic_button', 'fleet_operations', 'Panic Button Alert', 'EMERGENCY: Panic button activated - {{vehicle_name}}', 
'<div style="background-color: #f8d7da; padding: 20px; border: 2px solid #dc3545;"><h1 style="color: #dc3545; text-align: center;">🚨 EMERGENCY ALERT 🚨</h1><h2 style="color: #dc3545;">PANIC BUTTON ACTIVATED</h2><p><strong>{{vehicle_name}}</strong> panic button has been activated. Immediate response required.</p><p><strong>Emergency Details:</strong></p><ul><li>Vehicle: {{vehicle_name}}</li><li>Device ID: {{device_id}}</li><li>Activation Time: {{activation_time}}</li><li>Location: {{location}}</li><li>Driver: {{driver_name}}</li><li>Emergency Contact: {{emergency_contact}}</li></ul><p style="color: #dc3545; font-size: 18px;"><strong>RESPOND IMMEDIATELY</strong></p></div>',
'EMERGENCY: Panic button activated on {{vehicle_name}} at {{activation_time}}. Location: {{location}}. Driver: {{driver_name}}. RESPOND IMMEDIATELY.',
'["vehicle_name", "device_id", "activation_time", "location", "driver_name", "emergency_contact"]'::jsonb, '{}'::jsonb, 'critical'),

-- Maintenance Templates
('maintenance_due', 'maintenance', 'Maintenance Due Reminder', 'Maintenance Due: {{vehicle_name}} - {{maintenance_type}}', 
'<h2>Maintenance Due Reminder</h2><p>Vehicle <strong>{{vehicle_name}}</strong> requires scheduled maintenance.</p><p><strong>Maintenance Details:</strong></p><ul><li>Vehicle: {{vehicle_name}}</li><li>Maintenance Type: {{maintenance_type}}</li><li>Due Date: {{due_date}}</li><li>Current Mileage: {{current_mileage}}</li><li>Service Interval: {{service_interval}}</li></ul><p><strong>Recommended Action:</strong> Schedule maintenance appointment before the due date.</p>',
'Maintenance Due: {{vehicle_name}} requires {{maintenance_type}} by {{due_date}}. Current mileage: {{current_mileage}}.',
'["vehicle_name", "maintenance_type", "due_date", "current_mileage", "service_interval"]'::jsonb, '{}'::jsonb, 'medium'),

('service_appointment', 'maintenance', 'Service Appointment Confirmation', 'Service Appointment Scheduled: {{vehicle_name}}', 
'<h2>Service Appointment Confirmation</h2><p>Your service appointment has been successfully scheduled.</p><p><strong>Appointment Details:</strong></p><ul><li>Vehicle: {{vehicle_name}}</li><li>Service Type: {{service_type}}</li><li>Date & Time: {{appointment_datetime}}</li><li>Workshop: {{workshop_name}}</li><li>Address: {{workshop_address}}</li><li>Contact: {{workshop_contact}}</li></ul><p>Please ensure the vehicle is available at the scheduled time.</p>',
'Service appointment scheduled for {{vehicle_name}} on {{appointment_datetime}} at {{workshop_name}}. Service: {{service_type}}.',
'["vehicle_name", "service_type", "appointment_datetime", "workshop_name", "workshop_address", "workshop_contact"]'::jsonb, '{}'::jsonb, 'medium'),

-- System Templates
('user_welcome', 'system', 'Welcome to Fleet Management', 'Welcome to {{company_name}} Fleet Management', 
'<h1>Welcome to {{company_name}} Fleet Management!</h1><p>Hello {{user_name}},</p><p>Welcome to our comprehensive fleet management platform. Your account has been successfully created.</p><p><strong>Account Details:</strong></p><ul><li>Name: {{user_name}}</li><li>Email: {{user_email}}</li><li>Role: {{user_role}}</li><li>Company: {{company_name}}</li></ul><p><strong>Next Steps:</strong></p><ol><li>Complete your profile setup</li><li>Add your vehicles to the system</li><li>Configure your notification preferences</li></ol><p>If you need assistance, please contact our support team.</p>',
'Welcome {{user_name}} to {{company_name}} Fleet Management. Your account has been created. Role: {{user_role}}.',
'["user_name", "user_email", "user_role", "company_name"]'::jsonb, '{}'::jsonb, 'medium'),

('password_reset', 'system', 'Password Reset Request', 'Password Reset - {{company_name}} Fleet Management', 
'<h2>Password Reset Request</h2><p>Hello {{user_name}},</p><p>A password reset has been requested for your account.</p><p><strong>Reset Details:</strong></p><ul><li>Account: {{user_email}}</li><li>Request Time: {{request_time}}</li><li>IP Address: {{ip_address}}</li></ul><p><a href="{{reset_link}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p><p>This link will expire in {{expiry_time}} hours.</p><p>If you did not request this reset, please ignore this email.</p>',
'Password reset requested for {{user_email}}. Reset link: {{reset_link}}. Expires in {{expiry_time}} hours.',
'["user_name", "user_email", "request_time", "ip_address", "reset_link", "expiry_time"]'::jsonb, '{}'::jsonb, 'high'),

-- GP51 Integration Templates
('gp51_sync_failure', 'gp51_integration', 'GP51 Data Sync Failure', 'GP51 Sync Failed - {{sync_type}}', 
'<div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107;"><h2 style="color: #856404;">GP51 Data Sync Failure</h2><p>A data synchronization with GP51 has failed and requires attention.</p><p><strong>Sync Details:</strong></p><ul><li>Sync Type: {{sync_type}}</li><li>Failed At: {{failure_time}}</li><li>Error Message: {{error_message}}</li><li>Records Affected: {{affected_records}}</li><li>Retry Count: {{retry_count}}</li></ul><p><strong>Action Required:</strong> Check GP51 connection and retry sync operation.</p></div>',
'GP51 Sync Failed: {{sync_type}} at {{failure_time}}. Error: {{error_message}}. Affected records: {{affected_records}}.',
'["sync_type", "failure_time", "error_message", "affected_records", "retry_count"]'::jsonb, '{}'::jsonb, 'high'),

('gp51_connection_restored', 'gp51_integration', 'GP51 Connection Restored', 'GP51 Connection Restored Successfully', 
'<div style="background-color: #d4edda; padding: 20px; border-left: 4px solid #28a745;"><h2 style="color: #155724;">GP51 Connection Restored</h2><p>The connection to GP51 has been successfully restored.</p><p><strong>Restoration Details:</strong></p><ul><li>Restored At: {{restoration_time}}</li><li>Downtime Duration: {{downtime_duration}}</li><li>Connection Status: {{connection_status}}</li><li>Pending Sync Operations: {{pending_syncs}}</li></ul><p>All pending synchronization operations will resume automatically.</p></div>',
'GP51 Connection Restored at {{restoration_time}}. Downtime: {{downtime_duration}}. Pending syncs: {{pending_syncs}}.',
'["restoration_time", "downtime_duration", "connection_status", "pending_syncs"]'::jsonb, '{}'::jsonb, 'medium');

-- Create updated_at trigger for enhanced email templates
CREATE OR REPLACE FUNCTION update_enhanced_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enhanced_email_templates_updated_at
  BEFORE UPDATE ON public.enhanced_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_enhanced_email_templates_updated_at();

-- Create updated_at trigger for email automation rules
CREATE OR REPLACE FUNCTION update_email_automation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_automation_rules_updated_at
  BEFORE UPDATE ON public.email_automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_email_automation_rules_updated_at();
