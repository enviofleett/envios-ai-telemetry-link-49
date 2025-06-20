
-- Create the increment_token_usage function
CREATE OR REPLACE FUNCTION public.increment_token_usage(token_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.sharing_tokens
  SET usage_count = COALESCE(usage_count, 0) + 1,
      last_used_at = now()
  WHERE id = token_id_param
  RETURNING usage_count INTO new_count;
  
  RETURN COALESCE(new_count, 0);
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_token_usage(UUID) TO authenticated;

-- Add missing columns to sharing_tokens if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sharing_tokens' 
    AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE public.sharing_tokens ADD COLUMN usage_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sharing_tokens' 
    AND column_name = 'last_used_at'
  ) THEN
    ALTER TABLE public.sharing_tokens ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create minimal marketplace_refunds table
CREATE TABLE IF NOT EXISTS public.marketplace_refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  requester_id UUID NOT NULL,
  requester_type TEXT NOT NULL CHECK (requester_type IN ('buyer', 'merchant', 'admin')),
  refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial')),
  refund_amount NUMERIC NOT NULL DEFAULT 0,
  original_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed')),
  reason TEXT NOT NULL,
  rejection_reason TEXT,
  processed_by UUID,
  payment_processor_reference TEXT,
  evidence TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create marketplace_security_logs table for SecurityAuditService
CREATE TABLE IF NOT EXISTS public.marketplace_security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  additional_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace_security_alerts table for SecurityAuditService
CREATE TABLE IF NOT EXISTS public.marketplace_security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  user_id UUID,
  alert_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.marketplace_refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_security_alerts ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Admins can manage refunds" 
ON public.marketplace_refunds FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can view security logs" 
ON public.marketplace_security_logs FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage security alerts" 
ON public.marketplace_security_alerts FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Add updated_at trigger for marketplace_refunds
DROP TRIGGER IF EXISTS update_marketplace_refunds_updated_at ON public.marketplace_refunds;
CREATE TRIGGER update_marketplace_refunds_updated_at 
  BEFORE UPDATE ON public.marketplace_refunds 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
