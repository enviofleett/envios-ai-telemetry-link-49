
-- Insert packages without ON CONFLICT since there's no unique constraint on name
INSERT INTO public.packages (
  name, 
  description, 
  associated_user_type,
  price, 
  features, 
  is_active
) VALUES
(
  'Basic Plan',
  'Essential GPS tracking features for small fleets up to 10 vehicles',
  'end_user',
  9.99,
  '["real_time_tracking", "basic_reports", "mobile_app"]'::jsonb,
  true
),
(
  'Professional Plan', 
  'Advanced fleet management with geofencing and detailed analytics',
  'sub_admin',
  29.99,
  '["real_time_tracking", "advanced_reports", "geofencing", "driver_behavior", "mobile_app", "email_alerts"]'::jsonb,
  true
),
(
  'Enterprise Plan',
  'Complete fleet solution with unlimited vehicles and custom integrations',
  'sub_admin',
  99.99,
  '["real_time_tracking", "advanced_reports", "geofencing", "driver_behavior", "mobile_app", "email_alerts", "api_access", "custom_integrations", "priority_support"]'::jsonb,
  true
);
