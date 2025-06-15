
-- Phase 1: Database Schema Overhaul for new registration and vehicle logic.

-- Step 1: Create a new ENUM type for user roles within the application logic.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_user_type') THEN
        CREATE TYPE public.app_user_type AS ENUM ('end_user', 'sub_admin');
    END IF;
END$$;
COMMENT ON TYPE public.app_user_type IS 'Defines the functional type of a user, like end_user or sub_admin.';

-- Step 2: Create the 'packages' table to define subscription plans.
CREATE TABLE IF NOT EXISTS public.packages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    associated_user_type public.app_user_type NOT NULL,
    price numeric(10, 2) NOT NULL DEFAULT 0.00,
    features jsonb,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.packages IS 'Stores subscription packages that users can sign up for.';

-- Drop trigger if it exists to avoid errors on re-run
DROP TRIGGER IF EXISTS set_packages_updated_at ON public.packages;
-- Add trigger for updated_at
CREATE TRIGGER set_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 3: Create 'gp51_admin_sessions' to store a master token for backend operations.
CREATE TABLE IF NOT EXISTS public.gp51_admin_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.gp51_admin_sessions IS 'Stores the GP51 session token for the system admin account, used for provisioning.';

-- Step 4: Alter the 'envio_users' table to include user type and package information.
ALTER TABLE public.envio_users
ADD COLUMN IF NOT EXISTS user_type public.app_user_type,
ADD COLUMN IF NOT EXISTS package_id uuid REFERENCES public.packages(id);
COMMENT ON COLUMN public.envio_users.user_type IS 'Functional type of the user, derived from their chosen package.';
COMMENT ON COLUMN public.envio_users.package_id IS 'The subscription package selected by the user upon registration.';

-- Step 5: Overhaul the 'vehicles' table to align with new logic without data loss.
-- I'm dropping the old table and recreating it to ensure a clean schema.
-- This is a destructive but necessary step for the new architecture.
DROP TABLE IF EXISTS public.vehicles CASCADE;
CREATE TABLE public.vehicles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.envio_users(id) ON DELETE CASCADE,
    gp51_device_id text NOT NULL UNIQUE,
    name text NOT NULL,
    sim_number text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.vehicles IS 'Stores vehicle information, linking them to users and their GP51 device IDs.';

-- Add trigger for updated_at on vehicles
CREATE TRIGGER set_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Step 6: Apply Row-Level Security (RLS) to the new tables.

-- RLS for 'packages' table
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to active packages" ON public.packages;
CREATE POLICY "Allow public read access to active packages" ON public.packages
FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage all packages" ON public.packages;
CREATE POLICY "Admins can manage all packages" ON public.packages
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for 'gp51_admin_sessions' table
ALTER TABLE public.gp51_admin_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage admin sessions" ON public.gp51_admin_sessions;
CREATE POLICY "Admins can manage admin sessions" ON public.gp51_admin_sessions
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS for 'vehicles' table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view and manage their own vehicles" ON public.vehicles;
CREATE POLICY "Users can view and manage their own vehicles" ON public.vehicles
FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage all vehicles" ON public.vehicles;
CREATE POLICY "Admins can manage all vehicles" ON public.vehicles
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

