
-- Create missing tables for monitoring system

-- Create gp51_sync_discrepancies table
CREATE TABLE IF NOT EXISTS public.gp51_sync_discrepancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discrepancy_type text NOT NULL,
  source_system text NOT NULL DEFAULT 'gp51',
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  expected_value jsonb,
  actual_value jsonb,
  severity text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  auto_resolution_attempted boolean DEFAULT false,
  resolution_notes text,
  detected_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mobile_usage_analytics table
CREATE TABLE IF NOT EXISTS public.mobile_usage_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  session_id uuid,
  event_type text NOT NULL,
  event_category text NOT NULL,
  event_data jsonb DEFAULT '{}',
  platform text NOT NULL,
  app_version text,
  device_info jsonb DEFAULT '{}',
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mobile_performance_metrics table
CREATE TABLE IF NOT EXISTS public.mobile_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid,
  metric_type text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text,
  platform text NOT NULL,
  app_version text,
  device_info jsonb DEFAULT '{}',
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add missing columns to mobile_app_sessions
ALTER TABLE public.mobile_app_sessions 
ADD COLUMN IF NOT EXISTS platform_version text,
ADD COLUMN IF NOT EXISTS device_model text;

-- Add missing columns to mobile_app_crashes
ALTER TABLE public.mobile_app_crashes 
ADD COLUMN IF NOT EXISTS severity text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS error_message text;

-- Create execute_sql RPC function (simplified version for basic operations)
CREATE OR REPLACE FUNCTION public.execute_sql(query text, params text[] DEFAULT '{}')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- This is a simplified version for basic INSERT operations
  -- In production, you'd want more sophisticated query parsing and security
  IF query LIKE 'INSERT INTO system_alerts%' THEN
    -- Handle system alerts insertion
    EXECUTE query USING params[1], params[2], params[3], params[4], params[5], params[6], params[7];
    result := jsonb_build_object('success', true);
  ELSE
    -- For other operations, return an error
    result := jsonb_build_object('error', 'Operation not supported');
  END IF;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gp51_sync_discrepancies_entity ON public.gp51_sync_discrepancies(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_gp51_sync_discrepancies_status ON public.gp51_sync_discrepancies(status);
CREATE INDEX IF NOT EXISTS idx_mobile_usage_analytics_user ON public.mobile_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_performance_metrics_session ON public.mobile_performance_metrics(session_id);

-- Enable RLS on new tables
ALTER TABLE public.gp51_sync_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (admin only for monitoring tables)
CREATE POLICY "Admins can view gp51 sync discrepancies" ON public.gp51_sync_discrepancies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage gp51 sync discrepancies" ON public.gp51_sync_discrepancies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view mobile usage analytics" ON public.mobile_usage_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage mobile usage analytics" ON public.mobile_usage_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view mobile performance metrics" ON public.mobile_performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage mobile performance metrics" ON public.mobile_performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
