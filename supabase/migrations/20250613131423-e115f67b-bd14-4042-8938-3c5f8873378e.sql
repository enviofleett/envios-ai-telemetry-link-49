
-- Add VIN column to vehicles table with validation
ALTER TABLE vehicles 
ADD COLUMN vin VARCHAR(17) UNIQUE,
ADD COLUMN fuel_tank_capacity_liters NUMERIC(5,2),
ADD COLUMN manufacturer_fuel_consumption_100km_l NUMERIC(4,2);

-- Create VIN API configurations table
CREATE TABLE vin_api_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  provider_name TEXT NOT NULL DEFAULT 'vindecoder',
  api_key_encrypted TEXT NOT NULL,
  secret_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  primary_provider BOOLEAN NOT NULL DEFAULT false,
  rate_limit_per_day INTEGER DEFAULT 1000,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT,
  test_error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider_name)
);

-- Create VIN decode history table for audit purposes
CREATE TABLE vin_decode_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vin VARCHAR(17) NOT NULL,
  provider_name TEXT NOT NULL,
  decode_success BOOLEAN NOT NULL,
  decoded_data JSONB,
  error_message TEXT,
  api_response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE vin_api_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vin_decode_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for VIN API configurations (admin only)
CREATE POLICY "Admins can manage VIN API configurations" 
ON vin_api_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- RLS policies for VIN decode history
CREATE POLICY "Users can view their own VIN decode history" 
ON vin_decode_history 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own VIN decode history" 
ON vin_decode_history 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_vin_api_configurations_updated_at
BEFORE UPDATE ON vin_api_configurations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_vin_api_configurations_user_active ON vin_api_configurations(user_id, is_active);
CREATE INDEX idx_vin_decode_history_user_created ON vin_decode_history(user_id, created_at DESC);
CREATE INDEX idx_vehicles_vin ON vehicles(vin) WHERE vin IS NOT NULL;
