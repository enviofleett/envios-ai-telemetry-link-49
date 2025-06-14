
ALTER TABLE public.gp51_sessions
ADD COLUMN IF NOT EXISTS auth_method TEXT,
ADD COLUMN IF NOT EXISTS last_validated_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.gp51_sessions.auth_method IS 'Authentication method used by GP51 (e.g., GET, POST_JSON, POST_FORM)';
COMMENT ON COLUMN public.gp51_sessions.last_validated_at IS 'Timestamp of the last successful validation or token refresh for this session';

-- Initialize last_validated_at for existing rows to prevent issues with ORDER BY
-- This uses updated_at or created_at as a fallback.
UPDATE public.gp51_sessions
SET last_validated_at = COALESCE(updated_at, created_at, now())
WHERE last_validated_at IS NULL;
