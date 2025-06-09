
-- Extend map_api_configs table to support multiple providers
ALTER TABLE public.map_api_configs 
ADD COLUMN IF NOT EXISTS provider_specific_config jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS health_check_url text,
ADD COLUMN IF NOT EXISTS health_check_interval integer DEFAULT 300,
ADD COLUMN IF NOT EXISTS last_health_check timestamp with time zone,
ADD COLUMN IF NOT EXISTS health_status text DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS response_time_ms integer,
ADD COLUMN IF NOT EXISTS error_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_per_request numeric DEFAULT 0;

-- Create map provider health logs table
CREATE TABLE IF NOT EXISTS public.map_provider_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id uuid REFERENCES public.map_api_configs(id) ON DELETE CASCADE,
  check_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL, -- 'healthy', 'degraded', 'failed'
  response_time_ms integer,
  error_message text,
  metadata jsonb DEFAULT '{}'
);

-- Create map failover events table
CREATE TABLE IF NOT EXISTS public.map_failover_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_config_id uuid REFERENCES public.map_api_configs(id),
  to_config_id uuid REFERENCES public.map_api_configs(id),
  reason text NOT NULL,
  triggered_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'
);

-- Create vehicle position cache table for better performance
CREATE TABLE IF NOT EXISTS public.vehicle_position_cache (
  device_id text PRIMARY KEY,
  last_position jsonb NOT NULL,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'unknown', -- 'online', 'idle', 'offline'
  metadata jsonb DEFAULT '{}'
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_map_provider_health_logs_config_timestamp 
ON public.map_provider_health_logs(config_id, check_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_map_failover_events_timestamp 
ON public.map_failover_events(triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_position_cache_updated 
ON public.vehicle_position_cache(last_updated DESC);

-- Function to get the best available map provider
CREATE OR REPLACE FUNCTION public.get_best_map_provider()
RETURNS TABLE(api_key text, provider_type text, config_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  config_record RECORD;
  usage_count INTEGER;
  health_weight NUMERIC;
  cost_weight NUMERIC;
  best_score NUMERIC := -1;
  best_config RECORD;
BEGIN
  -- Get active configs ordered by a composite score
  FOR config_record IN 
    SELECT 
      id, 
      name, 
      map_api_configs.api_key, 
      map_api_configs.provider_type, 
      threshold_value,
      COALESCE(response_time_ms, 1000) as response_time,
      COALESCE(error_rate, 0) as error_rate,
      COALESCE(cost_per_request, 0.001) as cost_per_request,
      health_status,
      fallback_priority
    FROM public.map_api_configs 
    WHERE is_active = true 
    ORDER BY fallback_priority ASC
  LOOP
    -- Skip if provider is unhealthy
    IF config_record.health_status = 'failed' THEN
      CONTINUE;
    END IF;
    
    -- Check current usage
    SELECT COALESCE(request_count, 0) INTO usage_count
    FROM public.map_api_usage 
    WHERE api_config_id = config_record.id 
    AND usage_date = CURRENT_DATE;
    
    -- Skip if over threshold
    IF usage_count >= config_record.threshold_value THEN
      CONTINUE;
    END IF;
    
    -- Calculate composite score (lower is better)
    health_weight := CASE 
      WHEN config_record.health_status = 'healthy' THEN 1.0
      WHEN config_record.health_status = 'degraded' THEN 2.0
      ELSE 5.0
    END;
    
    cost_weight := config_record.cost_per_request * 1000; -- Normalize cost
    
    -- Composite score: prioritize health, then cost, then response time
    DECLARE
      current_score NUMERIC := (health_weight * 10) + cost_weight + (config_record.response_time / 100.0);
    BEGIN
      IF best_score = -1 OR current_score < best_score THEN
        best_score := current_score;
        best_config := config_record;
      END IF;
    END;
  END LOOP;
  
  -- Return best config or fallback to first available
  IF best_config.id IS NOT NULL THEN
    RETURN QUERY SELECT 
      best_config.api_key,
      best_config.provider_type,
      best_config.id;
  ELSE
    -- Fallback to first active config regardless of health
    SELECT map_api_configs.api_key, map_api_configs.provider_type, id 
    INTO api_key, provider_type, config_id
    FROM public.map_api_configs 
    WHERE is_active = true 
    ORDER BY fallback_priority ASC 
    LIMIT 1;
    
    RETURN QUERY SELECT get_best_map_provider.api_key, get_best_map_provider.provider_type, get_best_map_provider.config_id;
  END IF;
END;
$function$;

-- Function to log health check results
CREATE OR REPLACE FUNCTION public.log_map_provider_health(
  p_config_id uuid,
  p_status text,
  p_response_time integer DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert health log
  INSERT INTO public.map_provider_health_logs (
    config_id, status, response_time_ms, error_message
  ) VALUES (
    p_config_id, p_status, p_response_time, p_error_message
  );
  
  -- Update config health status
  UPDATE public.map_api_configs 
  SET 
    health_status = p_status,
    last_health_check = now(),
    response_time_ms = COALESCE(p_response_time, response_time_ms),
    error_rate = CASE 
      WHEN p_status = 'failed' THEN LEAST(error_rate + 0.1, 1.0)
      WHEN p_status = 'healthy' THEN GREATEST(error_rate - 0.05, 0.0)
      ELSE error_rate
    END
  WHERE id = p_config_id;
END;
$function$;

-- Function to log failover events
CREATE OR REPLACE FUNCTION public.log_map_failover(
  p_from_config_id uuid,
  p_to_config_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.map_failover_events (
    from_config_id, to_config_id, reason
  ) VALUES (
    p_from_config_id, p_to_config_id, p_reason
  );
END;
$function$;

-- Enable RLS on new tables
ALTER TABLE public.map_provider_health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_failover_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_position_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (admin access for now)
CREATE POLICY "Admin can manage health logs" ON public.map_provider_health_logs
  FOR ALL USING (true);

CREATE POLICY "Admin can manage failover events" ON public.map_failover_events
  FOR ALL USING (true);

CREATE POLICY "Admin can manage vehicle cache" ON public.vehicle_position_cache
  FOR ALL USING (true);
