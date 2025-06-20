
-- Create the ENUM type for mapping_type
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mapping_type_enum') THEN
        CREATE TYPE public.mapping_type_enum AS ENUM ('manual', 'auto', 'migrated');
    END IF;
END $$;

-- Since the table was just created and is likely empty, we can safely alter the column type
-- First, check if the column exists and alter it to use the ENUM
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='gp51_user_mappings' 
        AND column_name='mapping_type'
    ) THEN
        -- Drop the existing column and recreate it with the ENUM type
        ALTER TABLE public.gp51_user_mappings DROP COLUMN mapping_type;
        ALTER TABLE public.gp51_user_mappings ADD COLUMN mapping_type public.mapping_type_enum NOT NULL DEFAULT 'manual';
    ELSE
        -- If column doesn't exist, add it with the ENUM type
        ALTER TABLE public.gp51_user_mappings ADD COLUMN mapping_type public.mapping_type_enum NOT NULL DEFAULT 'manual';
    END IF;
END $$;

-- Add a comment to the enum type for documentation
COMMENT ON TYPE public.mapping_type_enum IS 'Defines the type of GP51 user mapping: manual (user-created), auto (system-generated), migrated (imported from legacy system)';

-- Verify the table structure
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'gp51_user_mappings' AND column_name = 'mapping_type';
