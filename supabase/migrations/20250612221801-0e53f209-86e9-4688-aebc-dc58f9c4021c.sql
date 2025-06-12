
-- Add missing columns to vehicles table
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS make text,
ADD COLUMN IF NOT EXISTS model text,
ADD COLUMN IF NOT EXISTS year integer,
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS license_plate text;

-- Add foreign key constraint for envio_user_id if it doesn't exist
DO $$ 
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vehicles_envio_user_id_fkey' 
        AND table_name = 'vehicles'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE vehicles 
        ADD CONSTRAINT vehicles_envio_user_id_fkey 
        FOREIGN KEY (envio_user_id) REFERENCES envio_users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Update any existing records to ensure data consistency
UPDATE vehicles SET 
    make = COALESCE(make, NULL),
    model = COALESCE(model, NULL),
    year = COALESCE(year, NULL),
    color = COALESCE(color, NULL),
    license_plate = COALESCE(license_plate, NULL)
WHERE make IS NULL OR model IS NULL OR year IS NULL OR color IS NULL OR license_plate IS NULL;
