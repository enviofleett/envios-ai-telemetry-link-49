
-- Update vehicles table with missing columns for enhanced management
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS vin TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS insurance_expiration_date DATE,
ADD COLUMN IF NOT EXISTS license_expiration_date DATE,
ADD COLUMN IF NOT EXISTS image_urls TEXT[],
ADD COLUMN IF NOT EXISTS fuel_tank_capacity_liters NUMERIC,
ADD COLUMN IF NOT EXISTS manufacturer_fuel_consumption_100km_l NUMERIC;

-- Update license_plate to be unique (if not already)
ALTER TABLE vehicles 
ADD CONSTRAINT vehicles_license_plate_unique UNIQUE (license_plate);

-- Create workshop_vehicle_activations table for workshop assignment
CREATE TABLE IF NOT EXISTS workshop_vehicle_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  activated_by UUID NOT NULL REFERENCES envio_users(id),
  activation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiration_date TIMESTAMP WITH TIME ZONE,
  activation_status TEXT NOT NULL DEFAULT 'active' CHECK (activation_status IN ('active', 'expired', 'cancelled')),
  service_type TEXT,
  activation_fee NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vehicle_id, workshop_id, activation_date)
);

-- Enable RLS on workshop_vehicle_activations
ALTER TABLE workshop_vehicle_activations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workshop_vehicle_activations
CREATE POLICY "Users can view their own workshop activations" 
  ON workshop_vehicle_activations 
  FOR SELECT 
  USING (activated_by = auth.uid());

CREATE POLICY "Users can create workshop activations" 
  ON workshop_vehicle_activations 
  FOR INSERT 
  WITH CHECK (activated_by = auth.uid());

CREATE POLICY "Users can update their own workshop activations" 
  ON workshop_vehicle_activations 
  FOR UPDATE 
  USING (activated_by = auth.uid());

-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for vehicle images
CREATE POLICY "Anyone can view vehicle images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'vehicle-images');

CREATE POLICY "Authenticated users can upload vehicle images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update vehicle images" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete vehicle images" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'vehicle-images' AND auth.role() = 'authenticated');

-- Create trigger to update workshop_vehicle_activations updated_at
CREATE OR REPLACE FUNCTION update_workshop_activations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workshop_activations_updated_at
  BEFORE UPDATE ON workshop_vehicle_activations
  FOR EACH ROW
  EXECUTE FUNCTION update_workshop_activations_updated_at();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workshop_activations_vehicle_id ON workshop_vehicle_activations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_workshop_activations_workshop_id ON workshop_vehicle_activations(workshop_id);
CREATE INDEX IF NOT EXISTS idx_workshop_activations_activated_by ON workshop_vehicle_activations(activated_by);
CREATE INDEX IF NOT EXISTS idx_workshop_activations_status ON workshop_vehicle_activations(activation_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
