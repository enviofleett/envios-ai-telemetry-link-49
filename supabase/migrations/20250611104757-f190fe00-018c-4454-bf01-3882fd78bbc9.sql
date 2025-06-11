
-- Add enhanced branding fields to branding_settings table
ALTER TABLE branding_settings 
ADD COLUMN IF NOT EXISTS company_name text DEFAULT 'FleetIQ',
ADD COLUMN IF NOT EXISTS tagline text DEFAULT 'GPS51 Management Platform',
ADD COLUMN IF NOT EXISTS subtitle text DEFAULT 'Professional vehicle tracking and management',
ADD COLUMN IF NOT EXISTS is_branding_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auth_page_branding boolean DEFAULT true;

-- Add currency management fields to company_settings table
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS currency_code text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS currency_symbol text DEFAULT '$',
ADD COLUMN IF NOT EXISTS currency_format text DEFAULT 'en-US';

-- Create an index for faster branding lookups
CREATE INDEX IF NOT EXISTS idx_branding_settings_user_active ON branding_settings(user_id, is_branding_active);
CREATE INDEX IF NOT EXISTS idx_company_settings_user ON company_settings(user_id);
