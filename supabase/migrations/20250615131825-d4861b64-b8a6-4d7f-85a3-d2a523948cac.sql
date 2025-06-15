
-- Step 1: Create tables for SMS rate limiting and cost control.
-- This table will store configurable limits for each user.
CREATE TABLE IF NOT EXISTS public.user_sms_limits (
  user_id UUID PRIMARY KEY REFERENCES public.envio_users(id) ON DELETE CASCADE,
  daily_limit INT NOT NULL DEFAULT 50,
  hourly_limit INT NOT NULL DEFAULT 10,
  monthly_budget NUMERIC(10, 2) NOT NULL DEFAULT 20.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- This table will track current SMS usage against the defined limits.
CREATE TABLE IF NOT EXISTS public.user_sms_usage (
    user_id UUID PRIMARY KEY REFERENCES public.envio_users(id) ON DELETE CASCADE,
    daily_count INT NOT NULL DEFAULT 0,
    hourly_count INT NOT NULL DEFAULT 0,
    monthly_spend NUMERIC(10, 4) NOT NULL DEFAULT 0.00,
    last_daily_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_hourly_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_monthly_reset TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Enhance the sms_logs table for delivery status and cost tracking.
-- Based on the application code, an 'sms_logs' table is expected to exist.
-- The following command will add the necessary columns.
ALTER TABLE public.sms_logs
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.envio_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 4) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

-- Step 3: Add a table to log incoming webhooks for security and debugging.
CREATE TABLE IF NOT EXISTS public.sms_webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_processed BOOLEAN NOT NULL DEFAULT FALSE,
    processing_error TEXT,
    request_body JSONB,
    request_headers JSONB
);

-- Step 4: Add a trigger for automatic 'updated_at' timestamp updates on the limits table.
CREATE TRIGGER handle_user_sms_limits_updated_at
BEFORE UPDATE ON public.user_sms_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Step 5: Secure the new tables with Row Level Security.
ALTER TABLE public.user_sms_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sms_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policy for Admins to manage SMS limits.
CREATE POLICY "Allow admins full access to user sms limits"
ON public.user_sms_limits FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy for Admins to view SMS usage data.
CREATE POLICY "Allow admins to view user sms usage"
ON public.user_sms_usage FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy for Admins to view incoming webhook logs.
CREATE POLICY "Allow admins to view sms webhook logs"
ON public.sms_webhook_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy for users to view their own SMS limits.
CREATE POLICY "Allow users to view their own sms limits"
ON public.user_sms_limits FOR SELECT
USING (auth.uid() = user_id);
