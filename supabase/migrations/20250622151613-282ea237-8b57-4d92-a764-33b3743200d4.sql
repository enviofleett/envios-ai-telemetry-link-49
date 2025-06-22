
-- Enhance vehicles table with GP51 device metadata fields
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS device_name text,
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS sim_number text,
ADD COLUMN IF NOT EXISTS last_active_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS expire_notify_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_free boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_edit boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS starred boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS login_name text,
ADD COLUMN IF NOT EXISTS gp51_group_id integer,
ADD COLUMN IF NOT EXISTS total_distance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_oil numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS altitude numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS course numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS device_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS arrived_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS valid_position_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS gp51_status integer,
ADD COLUMN IF NOT EXISTS gp51_status_text text,
ADD COLUMN IF NOT EXISTS gp51_alarm text,
ADD COLUMN IF NOT EXISTS last_sync_time timestamp with time zone DEFAULT now();

-- Create sync status tracking table
CREATE TABLE IF NOT EXISTS gp51_sync_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type text NOT NULL DEFAULT 'vehicle_sync',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'running',
  total_devices integer DEFAULT 0,
  successful_syncs integer DEFAULT 0,
  failed_syncs integer DEFAULT 0,
  error_log jsonb DEFAULT '[]'::jsonb,
  sync_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_gp51_device_id ON vehicles(gp51_device_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_sync_time ON vehicles(last_sync_time);
CREATE INDEX IF NOT EXISTS idx_gp51_sync_status_created_at ON gp51_sync_status(created_at);

-- Enable RLS for sync status table
ALTER TABLE gp51_sync_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for sync status (admin only for now)
CREATE POLICY "Admins can view sync status" ON gp51_sync_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Function to trigger sync via cron
CREATE OR REPLACE FUNCTION public.trigger_gp51_vehicle_sync()
RETURNS text AS $$
DECLARE
  response_record record;
  edge_function_url text := 'https://bjkqxmvjuewshomihjqm.supabase.co/functions/v1/syncGp51Vehicles';
  service_role_key text := current_setting('app.service_role_key', true);
BEGIN
  -- Use net.http_post to call the Edge Function
  SELECT status_code, content INTO response_record
  FROM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );

  -- Log the sync attempt
  INSERT INTO gp51_sync_status (sync_type, sync_details, status)
  VALUES (
    'cron_triggered',
    jsonb_build_object(
      'status_code', response_record.status_code,
      'response', response_record.content
    ),
    CASE WHEN response_record.status_code = 200 THEN 'completed' ELSE 'failed' END
  );

  RETURN 'Sync triggered, status: ' || response_record.status_code || ', response: ' || COALESCE(response_record.content, 'No response');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
