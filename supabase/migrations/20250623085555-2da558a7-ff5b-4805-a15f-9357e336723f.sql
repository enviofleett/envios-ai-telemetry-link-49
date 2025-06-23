
-- Add creator column to vehicles table to store GP51 creator information
ALTER TABLE public.vehicles 
ADD COLUMN creator text;

-- Add a comment for documentation
COMMENT ON COLUMN public.vehicles.creator IS 'GP51 creator/owner username from original system';
