
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Admins can view any branding settings" ON public.branding_settings;
DROP POLICY IF EXISTS "Admins can update any branding settings" ON public.branding_settings;
DROP POLICY IF EXISTS "Admins can insert branding settings for any user" ON public.branding_settings;

-- Create admin SELECT policy
CREATE POLICY "Admins can view any branding settings"
  ON public.branding_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create admin UPDATE policy
CREATE POLICY "Admins can update any branding settings"
  ON public.branding_settings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Create admin INSERT policy
CREATE POLICY "Admins can insert branding settings for any user"
  ON public.branding_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
