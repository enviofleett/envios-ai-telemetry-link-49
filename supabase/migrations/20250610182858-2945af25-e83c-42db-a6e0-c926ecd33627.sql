
-- Add unique constraint to smtp_configurations table to enable upsert operations
ALTER TABLE public.smtp_configurations 
ADD CONSTRAINT smtp_configurations_user_provider_unique 
UNIQUE (user_id, provider_name);
