
-- Phase 1: Database Schema Enhancement

-- Add missing telemetry columns to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS speed DECIMAL(6, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS heading DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fuel_level DECIMAL(5, 2),
ADD COLUMN IF NOT EXISTS odometer DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS altitude DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS acc_status TEXT,
ADD COLUMN IF NOT EXISTS last_update TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS alarm_status TEXT,
ADD COLUMN IF NOT EXISTS satellites INTEGER,
ADD COLUMN IF NOT EXISTS signal_strength INTEGER,
ADD COLUMN IF NOT EXISTS gp51_device_id TEXT,
ADD COLUMN IF NOT EXISTS activation_status TEXT DEFAULT 'inactive';

-- Create vehicle telemetry history table for time-series data
CREATE TABLE IF NOT EXISTS vehicle_telemetry_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(6, 2) DEFAULT 0,
  heading DECIMAL(5, 2) DEFAULT 0,
  fuel_level DECIMAL(5, 2),
  odometer DECIMAL(12, 2),
  altitude DECIMAL(8, 2),
  acc_status TEXT,
  alarm_status TEXT,
  satellites INTEGER,
  signal_strength INTEGER,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_vehicle_id ON vehicle_telemetry_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_timestamp ON vehicle_telemetry_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_device_id ON vehicle_telemetry_history(device_id);

-- Enhance gp51_sessions table with proper relationships
ALTER TABLE gp51_sessions 
ADD COLUMN IF NOT EXISTS device_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS session_health TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS api_version TEXT DEFAULT 'v1';

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_gp51_sessions_envio_user' 
        AND table_name = 'gp51_sessions'
    ) THEN
        ALTER TABLE gp51_sessions 
        ADD CONSTRAINT fk_gp51_sessions_envio_user 
        FOREIGN KEY (envio_user_id) REFERENCES envio_users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create GP51 user management tracking table
CREATE TABLE IF NOT EXISTS gp51_user_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_user_id UUID REFERENCES envio_users(id) ON DELETE CASCADE,
  gp51_username TEXT NOT NULL,
  gp51_user_type INTEGER DEFAULT 3,
  activation_status TEXT DEFAULT 'pending',
  activation_date TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(envio_user_id, gp51_username)
);

-- Create GP51 device management tracking table
CREATE TABLE IF NOT EXISTS gp51_device_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  gp51_device_id TEXT NOT NULL,
  device_type INTEGER,
  activation_status TEXT DEFAULT 'inactive',
  charge_years INTEGER DEFAULT 0,
  service_end_date TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_errors JSONB DEFAULT '[]',
  device_properties JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(vehicle_id, gp51_device_id)
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_gp51_user_management_envio_user ON gp51_user_management(envio_user_id);
CREATE INDEX IF NOT EXISTS idx_gp51_user_management_username ON gp51_user_management(gp51_username);
CREATE INDEX IF NOT EXISTS idx_gp51_device_management_vehicle ON gp51_device_management(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_gp51_device_management_device_id ON gp51_device_management(gp51_device_id);

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_gp51_user_management_updated_at ON gp51_user_management;
CREATE TRIGGER update_gp51_user_management_updated_at
    BEFORE UPDATE ON gp51_user_management
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gp51_device_management_updated_at ON gp51_device_management;
CREATE TRIGGER update_gp51_device_management_updated_at
    BEFORE UPDATE ON gp51_device_management
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
