
-- Create data sharing products table
CREATE TABLE IF NOT EXISTS public.data_sharing_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_cost_usd_per_month NUMERIC NOT NULL DEFAULT 0,
  cost_per_vehicle_usd_per_month NUMERIC NOT NULL DEFAULT 0,
  data_points_included TEXT[] NOT NULL DEFAULT '{}',
  features JSONB NOT NULL DEFAULT '{}',
  max_vehicles_allowed INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sharing tokens table for API access
CREATE TABLE IF NOT EXISTS public.sharing_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  subscription_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vehicle_ids TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  revoked_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription vehicles junction table
CREATE TABLE IF NOT EXISTS public.subscription_vehicles (
  subscription_id UUID NOT NULL,
  vehicle_id TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (subscription_id, vehicle_id)
);

-- Create API usage logs table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id UUID NOT NULL,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  vehicle_id TEXT,
  request_method TEXT NOT NULL,
  response_status INTEGER NOT NULL,
  response_time_ms INTEGER,
  request_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to user_subscriptions table
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS product_id UUID,
ADD COLUMN IF NOT EXISTS paystack_reference_id TEXT,
ADD COLUMN IF NOT EXISTS total_amount_paid_usd NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tenure_months INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

-- Add missing columns to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS total_mileage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuel_level NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS voltage NUMERIC DEFAULT 0;

-- Add missing columns to workshop_users table
ALTER TABLE public.workshop_users 
ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add RLS policies for data sharing tables
ALTER TABLE public.data_sharing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sharing_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Data sharing products are readable by all authenticated users
CREATE POLICY "Public can view active data sharing products" 
ON public.data_sharing_products FOR SELECT 
USING (is_active = true);

-- Users can only manage their own sharing tokens
CREATE POLICY "Users can manage their own sharing tokens" 
ON public.sharing_tokens FOR ALL 
USING (auth.uid() = user_id);

-- Users can only see their own subscription vehicles
CREATE POLICY "Users can manage their own subscription vehicles" 
ON public.subscription_vehicles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_subscriptions us 
    WHERE us.id = subscription_id AND us.user_id = auth.uid()
  )
);

-- Users can only see their own API usage logs
CREATE POLICY "Users can view their own API usage logs" 
ON public.api_usage_logs FOR SELECT 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sharing_tokens_user_id ON public.sharing_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_sharing_tokens_token ON public.sharing_tokens(token);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_subscription_vehicles_subscription_id ON public.subscription_vehicles(subscription_id);
