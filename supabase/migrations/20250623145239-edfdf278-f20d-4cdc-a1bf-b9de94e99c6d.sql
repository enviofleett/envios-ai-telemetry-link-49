
-- Create credential health reports table
CREATE TABLE public.credential_health_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  validation_job_id uuid,
  username text NOT NULL,
  health_status text NOT NULL DEFAULT 'unknown',
  connectivity_test_passed boolean NOT NULL DEFAULT false,
  api_response_time_ms integer,
  token_expires_at timestamp with time zone,
  issues_detected text[] DEFAULT '{}',
  recommendations text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create data consistency monitoring table
CREATE TABLE public.data_consistency_monitoring (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  total_entities_checked integer DEFAULT 0,
  discrepancies_found integer DEFAULT 0,
  auto_resolved integer DEFAULT 0,
  manual_review_required integer DEFAULT 0,
  consistency_score integer,
  detailed_results jsonb DEFAULT '{}',
  next_check_scheduled timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mobile app sessions table
CREATE TABLE public.mobile_app_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_id text NOT NULL,
  app_version text,
  platform text NOT NULL,
  session_start timestamp with time zone NOT NULL DEFAULT now(),
  session_end timestamp with time zone,
  duration_minutes integer,
  features_used text[] DEFAULT '{}',
  crash_count integer DEFAULT 0,
  performance_metrics jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create mobile app crashes table
CREATE TABLE public.mobile_app_crashes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid,
  user_id uuid,
  app_version text NOT NULL,
  platform text NOT NULL,
  crash_type text NOT NULL,
  error_message text,
  stack_trace text,
  device_info jsonb DEFAULT '{}',
  occurred_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create system alerts table
CREATE TABLE public.system_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  message text NOT NULL,
  source_system text,
  source_entity_id text,
  alert_data jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  acknowledged_at timestamp with time zone,
  acknowledged_by uuid,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create credential validation jobs table (referenced by credential_health_reports)
CREATE TABLE public.credential_validation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  validation_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  validation_results jsonb DEFAULT '{}',
  next_scheduled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.credential_health_reports 
ADD CONSTRAINT fk_credential_health_reports_validation_job 
FOREIGN KEY (validation_job_id) REFERENCES public.credential_validation_jobs(id);

ALTER TABLE public.mobile_app_crashes 
ADD CONSTRAINT fk_mobile_app_crashes_session 
FOREIGN KEY (session_id) REFERENCES public.mobile_app_sessions(id);

-- Add indexes for performance
CREATE INDEX idx_credential_health_reports_validation_job ON public.credential_health_reports(validation_job_id);
CREATE INDEX idx_credential_health_reports_created_at ON public.credential_health_reports(created_at);
CREATE INDEX idx_data_consistency_monitoring_created_at ON public.data_consistency_monitoring(created_at);
CREATE INDEX idx_mobile_app_sessions_user_id ON public.mobile_app_sessions(user_id);
CREATE INDEX idx_mobile_app_crashes_session_id ON public.mobile_app_crashes(session_id);
CREATE INDEX idx_system_alerts_created_at ON public.system_alerts(created_at);
CREATE INDEX idx_system_alerts_severity ON public.system_alerts(severity);

-- Enable RLS on all tables
ALTER TABLE public.credential_health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_consistency_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_app_crashes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_validation_jobs ENABLE ROW LEVEL SECURITY;

-- Add RLS policies (admin only for monitoring tables)
CREATE POLICY "Admins can view credential health reports" ON public.credential_health_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view data consistency monitoring" ON public.data_consistency_monitoring
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view mobile app sessions" ON public.mobile_app_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view mobile app crashes" ON public.mobile_app_crashes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view system alerts" ON public.system_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view credential validation jobs" ON public.credential_validation_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
