
-- Create tables for enhanced monitoring and alerting system

-- System health metrics for historical tracking
CREATE TABLE IF NOT EXISTS public.system_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'cpu', 'memory', 'database', 'gp51_sync', 'api_response_time'
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT NOT NULL, -- 'percentage', 'milliseconds', 'count', 'bytes'
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced error tracking logs
CREATE TABLE IF NOT EXISTS public.error_tracking_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_severity TEXT NOT NULL CHECK (error_severity IN ('low', 'medium', 'high', 'critical')),
  error_message TEXT NOT NULL,
  error_source TEXT NOT NULL, -- 'gp51_sync', 'database', 'api', 'ui', 'auth'
  error_stack TEXT,
  user_id UUID,
  session_id TEXT,
  error_context JSONB DEFAULT '{}',
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT,
  occurrence_count INTEGER DEFAULT 1,
  first_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alert configurations
CREATE TABLE IF NOT EXISTS public.alert_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- 'error_rate', 'performance', 'system_health', 'sync_failure'
  condition_rules JSONB NOT NULL, -- threshold rules and conditions
  notification_channels JSONB NOT NULL, -- email, sms, webhook configs
  is_active BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 5,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance metrics for sync operations
CREATE TABLE IF NOT EXISTS public.sync_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_operation_id UUID, -- references gp51_sync_status if available
  operation_type TEXT NOT NULL, -- 'vehicle_sync', 'user_sync', 'data_fetch'
  operation_duration_ms INTEGER NOT NULL,
  records_processed INTEGER DEFAULT 0,
  records_successful INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  api_calls_made INTEGER DEFAULT 0,
  memory_usage_mb NUMERIC,
  cpu_usage_percent NUMERIC,
  network_latency_ms INTEGER,
  error_details JSONB,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Alert history and tracking
CREATE TABLE IF NOT EXISTS public.alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_configuration_id UUID REFERENCES public.alert_configurations(id),
  alert_status TEXT NOT NULL CHECK (alert_status IN ('triggered', 'acknowledged', 'resolved', 'escalated')),
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  escalated_at TIMESTAMP WITH TIME ZONE,
  trigger_data JSONB NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  notification_details JSONB DEFAULT '{}',
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification channels configuration
CREATE TABLE IF NOT EXISTS public.notification_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('email', 'sms', 'webhook', 'in_app')),
  channel_config JSONB NOT NULL, -- email address, phone number, webhook URL, etc.
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_type_time ON public.system_health_metrics(metric_type, recorded_at);
CREATE INDEX IF NOT EXISTS idx_error_tracking_severity_time ON public.error_tracking_logs(error_severity, created_at);
CREATE INDEX IF NOT EXISTS idx_error_tracking_source_type ON public.error_tracking_logs(error_source, error_type);
CREATE INDEX IF NOT EXISTS idx_sync_performance_operation_time ON public.sync_performance_metrics(operation_type, started_at);
CREATE INDEX IF NOT EXISTS idx_alert_history_config_status ON public.alert_history(alert_configuration_id, alert_status);

-- Enable RLS on all tables
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - Admin access for monitoring tables
CREATE POLICY "Admins can access system health metrics" ON public.system_health_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can access error tracking logs" ON public.error_tracking_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage alert configurations" ON public.alert_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can access sync performance metrics" ON public.sync_performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can access alert history" ON public.alert_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can manage their notification channels" ON public.notification_channels
  FOR ALL USING (user_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monitoring_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alert_configurations_updated_at
  BEFORE UPDATE ON public.alert_configurations
  FOR EACH ROW EXECUTE FUNCTION update_monitoring_updated_at();

CREATE TRIGGER update_notification_channels_updated_at
  BEFORE UPDATE ON public.notification_channels
  FOR EACH ROW EXECUTE FUNCTION update_monitoring_updated_at();
