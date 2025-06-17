
-- Simple package insertion that matches the actual table structure
INSERT INTO public.packages (
  name, 
  description, 
  associated_user_type,
  price, 
  max_vehicles,
  features, 
  is_active
) VALUES
(
  'Basic Plan',
  'Essential GPS tracking features for small fleets up to 10 vehicles',
  'end_user',
  9.99,
  10,
  '["real_time_tracking", "basic_reports", "mobile_app"]'::jsonb,
  true
),
(
  'Professional Plan', 
  'Advanced fleet management with geofencing and detailed analytics',
  'sub_admin',
  29.99,
  50,
  '["real_time_tracking", "advanced_reports", "geofencing", "driver_behavior", "mobile_app", "email_alerts"]'::jsonb,
  true
),
(
  'Enterprise Plan',
  'Complete fleet solution with unlimited vehicles and custom integrations',
  'sub_admin',
  99.99,
  NULL,
  '["real_time_tracking", "advanced_reports", "geofencing", "driver_behavior", "mobile_app", "email_alerts", "api_access", "custom_integrations", "priority_support"]'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;
