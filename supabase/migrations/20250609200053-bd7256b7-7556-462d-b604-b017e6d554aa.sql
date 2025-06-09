
-- Update gp51_sessions table to ensure api_url column exists and is properly used
-- The api_url column should already exist, but let's make sure it's properly indexed for performance
CREATE INDEX IF NOT EXISTS idx_gp51_sessions_api_url ON gp51_sessions(api_url);

-- Add a comment to document the purpose of the api_url column
COMMENT ON COLUMN gp51_sessions.api_url IS 'The GP51 API base URL used for this session - must be used consistently for all API calls';
