
-- Step 1: Add new values to the app_role enum safely (one per statement)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    -- Add 'manager'
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager' AND enumtypid = 'app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
    END IF;
    -- Add 'fleet_manager'
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'fleet_manager' AND enumtypid = 'app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'fleet_manager';
    END IF;
    -- Add 'driver'
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'driver' AND enumtypid = 'app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';
    END IF;
    -- Add 'dispatcher'
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'dispatcher' AND enumtypid = 'app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dispatcher';
    END IF;
    -- Add 'compliance_officer'
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'compliance_officer' AND enumtypid = 'app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'compliance_officer';
    END IF;
  END IF;
END$$;
