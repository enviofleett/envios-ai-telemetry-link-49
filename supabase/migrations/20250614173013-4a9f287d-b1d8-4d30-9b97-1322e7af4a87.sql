
-- Create a table for storing global marketplace fee/commission settings
CREATE TABLE public.marketplace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_rate NUMERIC NOT NULL DEFAULT 10, -- default: 10%
  registration_fee NUMERIC NOT NULL DEFAULT 100, -- default: $100
  connection_fee NUMERIC NOT NULL DEFAULT 5, -- default: $5 per vehicle
  currency TEXT NOT NULL DEFAULT 'USD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID, -- references envio_users.id (admin user)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only admin users can select and update the settings
ALTER TABLE public.marketplace_settings ENABLE ROW LEVEL SECURITY;

-- Allow admin users to select (read)
CREATE POLICY "Marketplace settings read for admins"
  ON public.marketplace_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admin users to update settings
CREATE POLICY "Marketplace settings update for admins"
  ON public.marketplace_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only allow admins to insert (for future: maybe restrict to a single row)
CREATE POLICY "Marketplace settings insert for admins"
  ON public.marketplace_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admin users to delete (cleanup)
CREATE POLICY "Marketplace settings delete for admins"
  ON public.marketplace_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Optional: add a validation trigger to ensure only one row exists
CREATE OR REPLACE FUNCTION enforce_single_marketplace_settings_row()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.marketplace_settings) > 0 THEN
    RAISE EXCEPTION 'Only one settings row allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS single_settings_row ON public.marketplace_settings;
CREATE CONSTRAINT TRIGGER single_settings_row
AFTER INSERT ON public.marketplace_settings
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION enforce_single_marketplace_settings_row();
