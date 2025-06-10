
-- Create RPC function to get all user email preferences
CREATE OR REPLACE FUNCTION public.get_user_email_preferences()
RETURNS SETOF user_email_preferences
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.user_email_preferences
  WHERE user_id = auth.uid();
$$;

-- Create RPC function to get user email preferences by ID
CREATE OR REPLACE FUNCTION public.get_user_email_preferences_by_id(user_uuid uuid)
RETURNS SETOF user_email_preferences
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM public.user_email_preferences
  WHERE user_id = user_uuid AND user_id = auth.uid();
$$;
