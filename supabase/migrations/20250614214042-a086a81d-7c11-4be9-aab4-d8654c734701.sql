
-- Disable the trigger to allow modifications.
ALTER TABLE public.marketplace_settings DISABLE TRIGGER single_settings_row;

-- Add the new columns for category fees if they don't exist.
ALTER TABLE public.marketplace_settings
ADD COLUMN IF NOT EXISTS free_categories_included INTEGER,
ADD COLUMN IF NOT EXISTS additional_category_fee NUMERIC;

-- Update the existing settings row with default values for the new columns,
-- only if they are currently NULL. This ensures we don't overwrite existing data.
UPDATE public.marketplace_settings
SET
  free_categories_included = COALESCE(free_categories_included, 2),
  additional_category_fee = COALESCE(additional_category_fee, 10.00)
WHERE (SELECT COUNT(*) FROM public.marketplace_settings) = 1;

-- If for some reason no row exists, insert one. This is a fallback.
INSERT INTO public.marketplace_settings (commission_rate, registration_fee, connection_fee, currency, free_categories_included, additional_category_fee)
SELECT 10, 100, 5, 'USD', 2, 10.00
WHERE NOT EXISTS (SELECT 1 FROM public.marketplace_settings);

-- Make the columns NOT NULL now that they have values.
ALTER TABLE public.marketplace_settings
ALTER COLUMN free_categories_included SET NOT NULL,
ALTER COLUMN additional_category_fee SET NOT NULL;

-- Allow any authenticated user to read the marketplace settings, not just admins.
DROP POLICY IF EXISTS "Marketplace settings read for admins" ON public.marketplace_settings;
DROP POLICY IF EXISTS "Allow authenticated users to read marketplace settings" ON public.marketplace_settings;
CREATE POLICY "Allow authenticated users to read marketplace settings"
  ON public.marketplace_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Fix the trigger logic to allow exactly one row, not zero.
CREATE OR REPLACE FUNCTION enforce_single_marketplace_settings_row()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.marketplace_settings) > 1 THEN
    RAISE EXCEPTION 'Only one settings row allowed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-enable the trigger.
ALTER TABLE public.marketplace_settings ENABLE TRIGGER single_settings_row;

