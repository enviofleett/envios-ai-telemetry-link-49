
-- Create table for storing geocoding API configurations
CREATE TABLE IF NOT EXISTS public.geocoding_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  provider_name text NOT NULL CHECK (provider_name IN ('google-maps', 'maptiler')),
  api_key_encrypted text,
  is_active boolean NOT NULL DEFAULT true,
  primary_provider boolean NOT NULL DEFAULT false,
  fallback_provider boolean NOT NULL DEFAULT false,
  rate_limit_per_day integer DEFAULT 1000,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  last_tested_at timestamp with time zone,
  test_status text CHECK (test_status IN ('success', 'failed', 'pending')),
  test_error_message text,
  UNIQUE(user_id, provider_name)
);

-- Create table for geocoding usage tracking
CREATE TABLE IF NOT EXISTS public.geocoding_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  provider_name text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('reverse_geocode', 'forward_geocode')),
  latitude numeric(10,8),
  longitude numeric(11,8),
  address_input text,
  address_result text,
  response_time_ms integer,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  cache_hit boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for geocoding cache management
CREATE TABLE IF NOT EXISTS public.geocoding_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text NOT NULL UNIQUE,
  provider_name text NOT NULL,
  latitude numeric(10,8),
  longitude numeric(11,8),
  address_result text NOT NULL,
  confidence_score numeric(3,2),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours'),
  hit_count integer NOT NULL DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_geocoding_configurations_user_provider ON public.geocoding_configurations(user_id, provider_name);
CREATE INDEX IF NOT EXISTS idx_geocoding_usage_logs_user_created ON public.geocoding_usage_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_expires ON public.geocoding_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_geocoding_cache_key ON public.geocoding_cache(cache_key);

-- Enable Row Level Security
ALTER TABLE public.geocoding_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geocoding_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geocoding_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for geocoding_configurations
CREATE POLICY "Users can view their own geocoding configurations" 
  ON public.geocoding_configurations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own geocoding configurations" 
  ON public.geocoding_configurations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own geocoding configurations" 
  ON public.geocoding_configurations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own geocoding configurations" 
  ON public.geocoding_configurations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for geocoding_usage_logs
CREATE POLICY "Users can view their own geocoding usage logs" 
  ON public.geocoding_usage_logs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own geocoding usage logs" 
  ON public.geocoding_usage_logs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for geocoding_cache (shared cache)
CREATE POLICY "Users can view geocoding cache" 
  ON public.geocoding_cache 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can create geocoding cache entries" 
  ON public.geocoding_cache 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update geocoding cache entries" 
  ON public.geocoding_cache 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION public.clean_expired_geocoding_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.geocoding_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Create function to get geocoding statistics for a user
CREATE OR REPLACE FUNCTION public.get_geocoding_statistics(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats jsonb;
BEGIN
  -- Check if requesting user is the same as the requested user
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  SELECT jsonb_build_object(
    'total_requests', COUNT(*),
    'successful_requests', COUNT(*) FILTER (WHERE success = true),
    'failed_requests', COUNT(*) FILTER (WHERE success = false),
    'cache_hits', COUNT(*) FILTER (WHERE cache_hit = true),
    'google_maps_requests', COUNT(*) FILTER (WHERE provider_name = 'google-maps'),
    'maptiler_requests', COUNT(*) FILTER (WHERE provider_name = 'maptiler'),
    'average_response_time', AVG(response_time_ms),
    'last_30_days', COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')
  ) INTO stats
  FROM public.geocoding_usage_logs
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$;

-- Create function to update geocoding configuration
CREATE OR REPLACE FUNCTION public.upsert_geocoding_configuration(
  p_provider_name text,
  p_api_key_encrypted text,
  p_is_active boolean DEFAULT true,
  p_primary_provider boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_id uuid;
BEGIN
  -- Reset other providers as primary if this one is being set as primary
  IF p_primary_provider THEN
    UPDATE public.geocoding_configurations 
    SET primary_provider = false, updated_at = now()
    WHERE user_id = auth.uid() AND provider_name != p_provider_name;
  END IF;
  
  INSERT INTO public.geocoding_configurations (
    user_id, provider_name, api_key_encrypted, is_active, primary_provider
  ) VALUES (
    auth.uid(), p_provider_name, p_api_key_encrypted, p_is_active, p_primary_provider
  )
  ON CONFLICT (user_id, provider_name) 
  DO UPDATE SET 
    api_key_encrypted = EXCLUDED.api_key_encrypted,
    is_active = EXCLUDED.is_active,
    primary_provider = EXCLUDED.primary_provider,
    updated_at = now()
  RETURNING id INTO config_id;
  
  RETURN config_id;
END;
$$;

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_geocoding_configuration_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_geocoding_configurations_timestamp
  BEFORE UPDATE ON public.geocoding_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_geocoding_configuration_timestamp();
