
-- Create the paystack_settings table for each setting owner (user_id for now; you could later make it global/organization-scoped)
CREATE TABLE IF NOT EXISTS public.paystack_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES envio_users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'test', -- 'test' or 'live'
  webhook_url TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_test_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS, restrict to owner/admins
ALTER TABLE public.paystack_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can read own Paystack settings"
  ON public.paystack_settings
  FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "User can insert own Paystack settings"
  ON public.paystack_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "User can update own Paystack settings"
  ON public.paystack_settings
  FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "User can delete own Paystack settings"
  ON public.paystack_settings
  FOR DELETE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
