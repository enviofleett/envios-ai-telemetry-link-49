
-- Phase 1: Critical Database Schema Fix

-- Step 1: Rename existing gp51_sync_status table to gp51_entity_sync_conflicts
-- This preserves existing conflict tracking data
ALTER TABLE public.gp51_sync_status RENAME TO gp51_entity_sync_conflicts;

-- Step 2: Create new gp51_sync_status table with correct schema for overall sync job tracking
CREATE TABLE public.gp51_sync_status (
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

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_gp51_sync_status_created_at ON public.gp51_sync_status(created_at);
CREATE INDEX IF NOT EXISTS idx_gp51_sync_status_sync_type ON public.gp51_sync_status(sync_type);
CREATE INDEX IF NOT EXISTS idx_gp51_sync_status_status ON public.gp51_sync_status(status);

-- Step 4: Enable RLS for new sync status table
ALTER TABLE public.gp51_sync_status ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policy for sync status (admin only for now)
CREATE POLICY "Admins can view sync status" ON public.gp51_sync_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Step 6: Insert sample sync job entries for testing
INSERT INTO public.gp51_sync_status (sync_type, started_at, completed_at, status, total_devices, successful_syncs, failed_syncs, sync_details) VALUES
('vehicle_sync', now() - interval '2 hours', now() - interval '1 hour 45 minutes', 'completed', 150, 148, 2, '{"sync_method": "automated", "duration_minutes": 15}'),
('user_sync', now() - interval '4 hours', now() - interval '3 hours 30 minutes', 'completed', 25, 25, 0, '{"sync_method": "manual", "duration_minutes": 30}'),
('device_sync', now() - interval '30 minutes', null, 'running', 75, 45, 0, '{"sync_method": "automated", "estimated_completion": "5 minutes"}'),
('vehicle_sync', now() - interval '6 hours', now() - interval '5 hours 50 minutes', 'failed', 200, 180, 20, '{"sync_method": "automated", "error": "API rate limit exceeded", "duration_minutes": 10}');

-- Step 7: Update the trigger function to use the new table structure
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

  -- Log the sync attempt in the new gp51_sync_status table
  INSERT INTO public.gp51_sync_status (sync_type, sync_details, status)
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
