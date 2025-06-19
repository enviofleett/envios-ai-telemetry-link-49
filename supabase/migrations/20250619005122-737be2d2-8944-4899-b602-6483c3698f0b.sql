
-- Phase 3: Real-time Data Synchronization Schema Enhancement

-- Create vehicle position history table for tracking position changes over time
CREATE TABLE IF NOT EXISTS public.vehicle_position_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(6, 2) DEFAULT 0,
  heading DECIMAL(5, 2) DEFAULT 0,
  altitude DECIMAL(8, 2),
  satellites INTEGER,
  signal_strength INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sync_source TEXT DEFAULT 'gp51',
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sync configuration table for automated sync settings
CREATE TABLE IF NOT EXISTS public.sync_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL DEFAULT 'vehicle_positions',
  is_enabled BOOLEAN DEFAULT true,
  sync_interval_minutes INTEGER DEFAULT 2,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_at TIMESTAMP WITH TIME ZONE,
  sync_priority INTEGER DEFAULT 5,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  backoff_multiplier DECIMAL(3, 2) DEFAULT 1.5,
  sync_settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create vehicle events table for notifications and alerts
CREATE TABLE IF NOT EXISTS public.vehicle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_severity TEXT DEFAULT 'info',
  event_message TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create sync status table for monitoring sync health
CREATE TABLE IF NOT EXISTS public.sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'idle',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_position_history_vehicle_id ON public.vehicle_position_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_position_history_device_id ON public.vehicle_position_history(device_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_position_history_recorded_at ON public.vehicle_position_history(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_events_vehicle_id ON public.vehicle_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_events_occurred_at ON public.vehicle_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_events_acknowledged ON public.vehicle_events(is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_sync_status_type_created ON public.sync_status(sync_type, created_at DESC);

-- Enable realtime on vehicle tables for live updates
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
ALTER TABLE public.vehicle_position_history REPLICA IDENTITY FULL;
ALTER TABLE public.vehicle_events REPLICA IDENTITY FULL;
ALTER TABLE public.sync_status REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
  -- Add vehicles table to realtime publication if not already added
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'vehicles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  END IF;
  
  -- Add vehicle_position_history to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'vehicle_position_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_position_history;
  END IF;
  
  -- Add vehicle_events to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'vehicle_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_events;
  END IF;
  
  -- Add sync_status to realtime publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'sync_status'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_status;
  END IF;
END $$;

-- Insert default sync configuration
INSERT INTO public.sync_configuration (sync_type, sync_interval_minutes, sync_settings)
VALUES 
  ('vehicle_positions', 2, '{"include_historical": true, "batch_size": 50}'),
  ('vehicle_status', 1, '{"status_only": true, "quick_sync": true}'),
  ('device_telemetry', 5, '{"include_metadata": true, "full_sync": false}')
ON CONFLICT DO NOTHING;

-- Create function to update sync configuration timestamps
CREATE OR REPLACE FUNCTION update_sync_configuration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sync configuration updates
DROP TRIGGER IF EXISTS update_sync_configuration_timestamp_trigger ON public.sync_configuration;
CREATE TRIGGER update_sync_configuration_timestamp_trigger
  BEFORE UPDATE ON public.sync_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_configuration_timestamp();

-- Create function to automatically create vehicle events for significant changes
CREATE OR REPLACE FUNCTION create_vehicle_status_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Create event when vehicle status changes
  IF OLD.updated_at IS DISTINCT FROM NEW.updated_at THEN
    INSERT INTO public.vehicle_events (
      vehicle_id, 
      device_id, 
      event_type, 
      event_severity,
      event_message, 
      event_data,
      occurred_at
    ) VALUES (
      NEW.id,
      NEW.gp51_device_id,
      'status_update',
      'info',
      'Vehicle data updated from GP51',
      jsonb_build_object(
        'previous_update', OLD.updated_at,
        'current_update', NEW.updated_at,
        'sync_source', 'automated'
      ),
      NEW.updated_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vehicle status events
DROP TRIGGER IF EXISTS vehicle_status_event_trigger ON public.vehicles;
CREATE TRIGGER vehicle_status_event_trigger
  AFTER UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION create_vehicle_status_event();
