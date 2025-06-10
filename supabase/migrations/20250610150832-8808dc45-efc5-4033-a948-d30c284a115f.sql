
-- Create comprehensive audit logging system
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('login', 'logout', 'failed_login', 'password_change', 'role_change', 'admin_action', 'data_access', 'data_modification', 'system_access', 'api_access')),
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  request_details JSONB DEFAULT '{}'::jsonb,
  response_status INTEGER,
  error_message TEXT,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  success BOOLEAN NOT NULL DEFAULT true,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin action logs for workshop management
CREATE TABLE IF NOT EXISTS public.admin_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (action_type IN ('workshop_approval', 'workshop_rejection', 'workshop_suspension', 'user_role_change', 'system_config_change', 'bulk_import', 'data_export', 'security_config')),
  target_entity_type TEXT NOT NULL,
  target_entity_id UUID,
  action_details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  session_fingerprint TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create session security tracking
CREATE TABLE IF NOT EXISTS public.secure_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  session_fingerprint TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_reason TEXT
);

-- Create rate limiting tracking
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  window_duration_seconds INTEGER NOT NULL DEFAULT 3600, -- 1 hour default
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  block_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create error logging for comprehensive error tracking
CREATE TABLE IF NOT EXISTS public.application_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  error_type TEXT NOT NULL CHECK (error_type IN ('javascript', 'network', 'validation', 'authentication', 'authorization', 'database', 'external_api', 'component_crash')),
  error_message TEXT NOT NULL,
  error_stack TEXT,
  component_name TEXT,
  route_path TEXT,
  user_agent TEXT,
  ip_address INET,
  session_id TEXT,
  error_context JSONB DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all audit tables
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_errors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for security_audit_logs
CREATE POLICY "Admins can view all security audit logs" 
  ON public.security_audit_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert security audit logs" 
  ON public.security_audit_logs 
  FOR INSERT 
  WITH CHECK (true); -- Allow system to log security events

-- Create RLS policies for admin_action_logs
CREATE POLICY "Admins can view admin action logs" 
  ON public.admin_action_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert admin action logs" 
  ON public.admin_action_logs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for secure_sessions
CREATE POLICY "Users can view their own sessions" 
  ON public.secure_sessions 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own sessions" 
  ON public.secure_sessions 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions" 
  ON public.secure_sessions 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create RLS policies for api_rate_limits
CREATE POLICY "System can manage rate limits" 
  ON public.api_rate_limits 
  FOR ALL 
  USING (true); -- System needs full access for rate limiting

-- Create RLS policies for application_errors
CREATE POLICY "Admins can view all application errors" 
  ON public.application_errors 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can log application errors" 
  ON public.application_errors 
  FOR INSERT 
  WITH CHECK (true); -- Allow error logging from anywhere

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user_id ON public.security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_timestamp ON public.security_audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_action_type ON public.security_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_risk_level ON public.security_audit_logs(risk_level);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_admin_user_id ON public.admin_action_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_performed_at ON public.admin_action_logs(performed_at);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_action_type ON public.admin_action_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_secure_sessions_user_id ON public.secure_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_session_token ON public.secure_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_expires_at ON public.secure_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_is_active ON public.secure_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_identifier ON public.api_rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_endpoint ON public.api_rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window_start ON public.api_rate_limits(window_start);

CREATE INDEX IF NOT EXISTS idx_application_errors_user_id ON public.application_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_application_errors_created_at ON public.application_errors(created_at);
CREATE INDEX IF NOT EXISTS idx_application_errors_error_type ON public.application_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_application_errors_severity ON public.application_errors(severity);

-- Create functions for audit logging
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_request_details JSONB DEFAULT '{}'::jsonb,
  p_response_status INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_risk_level TEXT DEFAULT 'low',
  p_success BOOLEAN DEFAULT true
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id, action_type, resource_type, resource_id, ip_address,
    user_agent, session_id, request_details, response_status,
    error_message, risk_level, success
  ) VALUES (
    p_user_id, p_action_type, p_resource_type, p_resource_id, p_ip_address,
    p_user_agent, p_session_id, p_request_details, p_response_status,
    p_error_message, p_risk_level, p_success
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function for admin action logging
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id UUID,
  p_action_type TEXT,
  p_target_entity_type TEXT,
  p_target_entity_id UUID DEFAULT NULL,
  p_action_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_fingerprint TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.admin_action_logs (
    admin_user_id, action_type, target_entity_type, target_entity_id,
    action_details, ip_address, user_agent, session_fingerprint
  ) VALUES (
    p_admin_user_id, p_action_type, p_target_entity_type, p_target_entity_id,
    p_action_details, p_ip_address, p_user_agent, p_session_fingerprint
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function for rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 100,
  p_window_seconds INTEGER DEFAULT 3600
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := now() - (p_window_seconds || ' seconds')::INTERVAL;
  
  -- Clean up old entries
  DELETE FROM public.api_rate_limits 
  WHERE window_start < window_start - INTERVAL '1 day';
  
  -- Get current count for this identifier and endpoint
  SELECT COALESCE(SUM(request_count), 0) INTO current_count
  FROM public.api_rate_limits
  WHERE identifier = p_identifier 
    AND endpoint = p_endpoint 
    AND window_start >= window_start;
  
  -- Check if limit exceeded
  IF current_count >= p_max_requests THEN
    -- Update or insert blocked record
    INSERT INTO public.api_rate_limits (
      identifier, endpoint, request_count, window_start, 
      window_duration_seconds, is_blocked, block_expires_at
    ) VALUES (
      p_identifier, p_endpoint, current_count + 1, now(),
      p_window_seconds, true, now() + (p_window_seconds || ' seconds')::INTERVAL
    ) ON CONFLICT (identifier, endpoint) DO UPDATE SET
      request_count = api_rate_limits.request_count + 1,
      is_blocked = true,
      block_expires_at = now() + (p_window_seconds || ' seconds')::INTERVAL,
      updated_at = now();
    
    RETURN false; -- Rate limit exceeded
  ELSE
    -- Insert or update request count
    INSERT INTO public.api_rate_limits (
      identifier, endpoint, request_count, window_start, window_duration_seconds
    ) VALUES (
      p_identifier, p_endpoint, 1, now(), p_window_seconds
    ) ON CONFLICT (identifier, endpoint) DO UPDATE SET
      request_count = api_rate_limits.request_count + 1,
      updated_at = now();
    
    RETURN true; -- Request allowed
  END IF;
END;
$$;

-- Create function for cleaning expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.secure_sessions 
  WHERE expires_at < now() OR (is_active = false AND revoked_at < now() - INTERVAL '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
