
-- Add missing fields to vehicles table to support GP51 data storage
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS last_position JSONB,
ADD COLUMN IF NOT EXISTS gp51_metadata JSONB,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for better performance on GP51 device lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_gp51_device_id ON vehicles(gp51_device_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON vehicles(is_active);
