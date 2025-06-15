
-- Add the new feature to the package_features table
INSERT INTO public.package_features (feature_id, feature_name, description, category, is_active)
VALUES
(
  'ai_parking_monitor',
  'AI Parking Anomaly Detection',
  'AI-powered monitoring of vehicle parking patterns with intelligent anomaly detection and natural language alerts for unusual overnight parking locations.',
  'ai',
  true
)
ON CONFLICT (feature_id) DO NOTHING;

-- Create a function to check if a user has access to a specific feature
CREATE OR REPLACE FUNCTION public.user_has_feature(_user_id uuid, _feature_id_text text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  -- First, check if the user is an admin. Admins have all features.
  WITH user_is_admin AS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
    LIMIT 1
  )
  -- If user is admin, return true. Otherwise, check feature access.
  SELECT
    (SELECT EXISTS (SELECT 1 FROM user_is_admin))
    OR
    (SELECT EXISTS (
      -- Get active subscription for the user
      WITH active_sub AS (
        SELECT package_id
        FROM public.user_subscriptions
        WHERE user_id = _user_id AND subscription_status = 'active'
        LIMIT 1
      )
      -- Check if the feature is assigned to that package
      SELECT 1
      FROM public.package_feature_assignments pfa
      -- This join requires package_features.id to exist
      -- Let's assume package_features.feature_id is the primary key or unique
      -- And package_feature_assignments uses that. But the schema says package_features.id is a uuid
      -- and feature_id is text. This join might be wrong.
      -- Re-checking my original logic. pfa.feature_id is a UUID referencing package_features.id
      -- But I'm checking against _feature_id_text which is a text field.
      -- The join should be correct if package_features.feature_id is the text identifier.
      JOIN public.package_features pf ON pfa.feature_id = pf.id
      WHERE pfa.package_id = (SELECT package_id FROM active_sub)
        AND pf.feature_id = _feature_id_text
    ))
$function$
;
