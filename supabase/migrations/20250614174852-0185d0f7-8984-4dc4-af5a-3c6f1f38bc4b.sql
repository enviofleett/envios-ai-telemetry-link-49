
-- 1. Category-Specific Commission Rates
CREATE TABLE public.category_commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 10,
  currency TEXT NOT NULL DEFAULT 'USD',
  country_code TEXT NOT NULL DEFAULT 'US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT category_country_unique UNIQUE (category_id, country_code)
);

-- 2. Merchant Fee Overrides (per-merchant rates/fees)
CREATE TABLE public.merchant_fee_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  commission_rate_override NUMERIC,
  registration_fee_override NUMERIC,
  commission_currency TEXT DEFAULT NULL,
  registration_fee_currency TEXT DEFAULT NULL,
  billing_cycle TEXT DEFAULT 'yearly', -- possible: yearly, monthly, quarterly
  country_code TEXT DEFAULT NULL,
  effective_from TIMESTAMPTZ DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT merchant_override_unique UNIQUE (merchant_id, country_code)
);

-- 3. Country-Specific Marketplace Settings
CREATE TABLE public.country_marketplace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  default_commission_rate NUMERIC NOT NULL DEFAULT 10,
  default_registration_fee NUMERIC NOT NULL DEFAULT 100,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycles TEXT[] NOT NULL DEFAULT ARRAY['yearly','monthly','quarterly'],
  supported_payment_methods TEXT[] NOT NULL DEFAULT ARRAY['card', 'bank_transfer'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT country_uniqueness UNIQUE (country_code)
);

-- 4. Add country and currency fields to merchants
-- (Assuming there is a merchants or envio_users table, using envio_users for this migration)

ALTER TABLE public.envio_users
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS preferred_currency TEXT;

-- 5. Add default country code and currency to marketplace_settings
ALTER TABLE public.marketplace_settings
ADD COLUMN IF NOT EXISTS default_country_code TEXT DEFAULT 'US',
ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'USD';

-- 6. Enable RLS and policies (if needed)
ALTER TABLE public.category_commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_fee_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_marketplace_settings ENABLE ROW LEVEL SECURITY;

-- Allow only admin users to manage these settings
CREATE POLICY "Admins can manage category rates"
  ON public.category_commission_rates
  FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage merchant overrides"
  ON public.merchant_fee_overrides
  FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage country marketplace settings"
  ON public.country_marketplace_settings
  FOR ALL
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
