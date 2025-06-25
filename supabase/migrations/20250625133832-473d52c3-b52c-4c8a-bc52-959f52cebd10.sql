
-- Phase 1: GPS51 Production System Database Schema Foundation

-- Create comprehensive GPS51 data management tables
CREATE TABLE IF NOT EXISTS public.gps51_groups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id integer NOT NULL UNIQUE,
    group_name text NOT NULL,
    remark text,
    shared integer DEFAULT 0,
    device_count integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_sync_at timestamp with time zone,
    is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.gps51_devices (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id text NOT NULL UNIQUE,
    device_name text NOT NULL,
    device_type integer NOT NULL,
    group_id integer REFERENCES public.gps51_groups(group_id),
    sim_number text,
    sim_iccid text,
    create_time bigint,
    init_loc_time bigint,
    first_loc_time bigint,
    overdue_time bigint,
    expire_notify_time bigint,
    precharge_years integer DEFAULT 0,
    remark text,
    remark2 text,
    creator text,
    video_channel_count integer DEFAULT 4,
    video_channel_setting text,
    last_active_time bigint,
    is_free integer DEFAULT 0,
    allow_edit integer DEFAULT 1,
    starred integer DEFAULT 0,
    icon integer DEFAULT 0,
    login_name text,
    forward_id text,
    need_alarm_str text,
    offline_delay integer DEFAULT 30,
    car_tag_color integer DEFAULT 1,
    package_ids integer DEFAULT 0,
    notify_phone_num_is_open integer DEFAULT 0,
    device_tag text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_sync_at timestamp with time zone,
    is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.gps51_positions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id text NOT NULL REFERENCES public.gps51_devices(device_id),
    latitude numeric(10, 8),
    longitude numeric(11, 8),
    speed numeric(6, 2) DEFAULT 0,
    course integer DEFAULT 0,
    altitude numeric(8, 2) DEFAULT 0,
    gps_time bigint,
    server_time bigint,
    status_code integer,
    status_text text,
    address text,
    mileage numeric(12, 2) DEFAULT 0,
    fuel_level numeric(5, 2),
    temperature numeric(5, 2),
    voltage numeric(5, 2),
    signal_strength integer,
    satellites integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    is_valid boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.gps51_users (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gp51_username text NOT NULL UNIQUE,
    user_type integer NOT NULL,
    nickname text,
    company_name text,
    email text,
    phone text,
    qq text,
    wechat text,
    multi_login integer DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    last_sync_at timestamp with time zone,
    is_active boolean DEFAULT true,
    envio_user_id uuid REFERENCES public.envio_users(id)
);

CREATE TABLE IF NOT EXISTS public.gps51_import_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    import_type text NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    started_at timestamp with time zone NOT NULL DEFAULT now(),
    completed_at timestamp with time zone,
    total_records integer DEFAULT 0,
    successful_records integer DEFAULT 0,
    failed_records integer DEFAULT 0,
    error_details jsonb DEFAULT '[]'::jsonb,
    import_summary jsonb DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES public.envio_users(id),
    batch_id uuid,
    source_system text DEFAULT 'gps51'
);

CREATE TABLE IF NOT EXISTS public.gps51_sync_status (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_type text NOT NULL,
    last_sync_time timestamp with time zone NOT NULL DEFAULT now(),
    next_sync_time timestamp with time zone,
    sync_interval_minutes integer DEFAULT 15,
    status text NOT NULL DEFAULT 'active',
    error_count integer DEFAULT 0,
    last_error text,
    sync_details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gps51_analytics (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_type text NOT NULL,
    metric_date date NOT NULL,
    device_count integer DEFAULT 0,
    active_devices integer DEFAULT 0,
    position_updates integer DEFAULT 0,
    data_volume_mb numeric(10, 2) DEFAULT 0,
    avg_response_time_ms integer DEFAULT 0,
    error_rate numeric(5, 4) DEFAULT 0,
    sync_success_rate numeric(5, 4) DEFAULT 1.0,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(metric_type, metric_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gps51_devices_device_id ON public.gps51_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_gps51_devices_group_id ON public.gps51_devices(group_id);
CREATE INDEX IF NOT EXISTS idx_gps51_devices_last_active ON public.gps51_devices(last_active_time);
CREATE INDEX IF NOT EXISTS idx_gps51_positions_device_id ON public.gps51_positions(device_id);
CREATE INDEX IF NOT EXISTS idx_gps51_positions_gps_time ON public.gps51_positions(gps_time);
CREATE INDEX IF NOT EXISTS idx_gps51_positions_created_at ON public.gps51_positions(created_at);
CREATE INDEX IF NOT EXISTS idx_gps51_import_logs_status ON public.gps51_import_logs(status);
CREATE INDEX IF NOT EXISTS idx_gps51_import_logs_started_at ON public.gps51_import_logs(started_at);

-- Enable Row Level Security
ALTER TABLE public.gps51_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps51_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps51_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps51_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps51_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps51_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gps51_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for GPS51 tables
CREATE POLICY "Admins can manage all GPS51 groups" ON public.gps51_groups
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all GPS51 devices" ON public.gps51_devices
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all GPS51 positions" ON public.gps51_positions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all GPS51 users" ON public.gps51_users
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all GPS51 import logs" ON public.gps51_import_logs
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all GPS51 sync status" ON public.gps51_sync_status
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view GPS51 analytics" ON public.gps51_analytics
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_gps51_groups_updated_at
BEFORE UPDATE ON public.gps51_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_gps51_devices_updated_at
BEFORE UPDATE ON public.gps51_devices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_gps51_users_updated_at
BEFORE UPDATE ON public.gps51_users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_gps51_sync_status_updated_at
BEFORE UPDATE ON public.gps51_sync_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for GPS51 analytics aggregation
CREATE OR REPLACE FUNCTION public.update_gps51_daily_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.gps51_analytics (
    metric_type, metric_date, device_count, active_devices, position_updates
  )
  SELECT 
    'daily_summary',
    CURRENT_DATE,
    COUNT(DISTINCT d.device_id),
    COUNT(DISTINCT CASE WHEN d.is_free = 0 THEN d.device_id END),
    COUNT(p.id)
  FROM public.gps51_devices d
  LEFT JOIN public.gps51_positions p ON d.device_id = p.device_id 
    AND p.created_at >= CURRENT_DATE
  WHERE d.is_active = true
  ON CONFLICT (metric_type, metric_date) 
  DO UPDATE SET
    device_count = EXCLUDED.device_count,
    active_devices = EXCLUDED.active_devices,
    position_updates = EXCLUDED.position_updates,
    created_at = now();
END;
$$;
