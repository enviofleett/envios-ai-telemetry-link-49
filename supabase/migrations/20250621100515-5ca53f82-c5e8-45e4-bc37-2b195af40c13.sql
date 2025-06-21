
-- Phase 5: Database and Migration Updates for GP51 URL Standardization (Final)
-- Update default values and existing records to use standardized GP51 base URL

-- Update gp51_sessions table: change existing records from /webapi URLs to base URLs
UPDATE gp51_sessions 
SET api_url = 'https://www.gps51.com'
WHERE api_url IN (
  'https://www.gps51.com/webapi',
  'http://www.gps51.com/webapi',
  'https://gps51.com/webapi',
  'http://gps51.com/webapi'
);

-- Update gp51_secure_credentials table: standardize API URLs
UPDATE gp51_secure_credentials 
SET api_url = 'https://www.gps51.com'
WHERE api_url IN (
  'https://www.gps51.com/webapi',
  'http://www.gps51.com/webapi',
  'https://gps51.com/webapi',
  'http://gps51.com/webapi'
);

-- Update any import job configurations that might reference GP51 URLs
UPDATE csv_import_jobs 
SET import_results = jsonb_set(
  import_results, 
  '{gp51_api_url}', 
  '"https://www.gps51.com"'::jsonb
)
WHERE import_results ? 'gp51_api_url' 
AND import_results->>'gp51_api_url' LIKE '%/webapi%';

-- Update bulk_extraction_jobs configuration data
UPDATE bulk_extraction_jobs 
SET extracted_data = jsonb_set(
  extracted_data, 
  '{api_url}', 
  '"https://www.gps51.com"'::jsonb
)
WHERE extracted_data ? 'api_url' 
AND extracted_data->>'api_url' LIKE '%/webapi%';

-- Add a comment to document this migration
COMMENT ON TABLE gp51_sessions IS 'GP51 authentication sessions - api_url should use base URL (https://www.gps51.com) without /webapi suffix';
COMMENT ON TABLE gp51_secure_credentials IS 'Secure GP51 credentials storage - api_url standardized to base URL format';

-- Create a function to validate GP51 URLs in future inserts/updates
CREATE OR REPLACE FUNCTION validate_gp51_base_url(url_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if URL is a valid GP51 base URL (without /webapi)
  RETURN url_to_check ~ '^https?://(?:www\.)?gps51\.com/?$';
END;
$$;
