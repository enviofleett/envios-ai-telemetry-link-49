
-- Add unique constraint to sms_configurations table to enable upsert operations
ALTER TABLE public.sms_configurations 
ADD CONSTRAINT sms_configurations_user_provider_unique 
UNIQUE (user_id, provider_name);
