
-- Create enum types for email campaign target audience and schedule type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_target_audience_enum') THEN
    CREATE TYPE campaign_target_audience_enum AS ENUM ('all_users', 'specific_users', 'user_segments');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_schedule_type_enum') THEN
    CREATE TYPE campaign_schedule_type_enum AS ENUM ('immediate', 'scheduled', 'recurring');
  END IF;
END $$;

-- Update email_campaigns table to use the new enum types
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_campaigns') THEN
    -- First drop the default value for target_audience
    ALTER TABLE public.email_campaigns ALTER COLUMN target_audience DROP DEFAULT;
    
    -- Update target_audience column to use enum
    ALTER TABLE public.email_campaigns 
    ALTER COLUMN target_audience TYPE campaign_target_audience_enum 
    USING target_audience::campaign_target_audience_enum;
    
    -- Set new default value for target_audience
    ALTER TABLE public.email_campaigns 
    ALTER COLUMN target_audience SET DEFAULT 'all_users'::campaign_target_audience_enum;
    
    -- First drop the default value for schedule_type
    ALTER TABLE public.email_campaigns ALTER COLUMN schedule_type DROP DEFAULT;
    
    -- Update schedule_type column to use enum
    ALTER TABLE public.email_campaigns 
    ALTER COLUMN schedule_type TYPE campaign_schedule_type_enum 
    USING schedule_type::campaign_schedule_type_enum;
    
    -- Set new default value for schedule_type
    ALTER TABLE public.email_campaigns 
    ALTER COLUMN schedule_type SET DEFAULT 'immediate'::campaign_schedule_type_enum;
  END IF;
END $$;
