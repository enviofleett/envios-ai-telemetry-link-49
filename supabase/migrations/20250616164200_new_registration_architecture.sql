
-- Phase 1: Database Schema Updates for New Registration Architecture

-- 1. Create packages table for package-driven registration
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  associated_user_type public.app_user_type NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  max_vehicles INTEGER,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create pending_user_registrations table for approval workflow
CREATE TABLE IF NOT EXISTS public.pending_user_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone_number TEXT,
  company_name TEXT,
  selected_package_id UUID NOT NULL REFERENCES public.packages(id),
  registration_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Add new columns to envio_users for package-driven system
ALTER TABLE public.envio_users 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- 4. Add vehicle status tracking and GP51 sync fields
ALTER TABLE public.vehicles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS gp51_sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS last_gp51_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS registration_source TEXT DEFAULT 'admin';

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packages_user_type ON public.packages(associated_user_type);
CREATE INDEX IF NOT EXISTS idx_packages_active ON public.packages(is_active);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_status ON public.pending_user_registrations(status);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_package ON public.pending_user_registrations(selected_package_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_gp51_sync ON public.vehicles(gp51_sync_status);

-- 6. Enable RLS on new tables
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_user_registrations ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for packages (readable by all, manageable by admins)
DROP POLICY IF EXISTS "Packages are viewable by everyone" ON public.packages;
CREATE POLICY "Packages are viewable by everyone" ON public.packages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Packages are manageable by admins" ON public.packages;
CREATE POLICY "Packages are manageable by admins" ON public.packages
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 8. Create RLS policies for pending registrations (admin only)
DROP POLICY IF EXISTS "Pending registrations manageable by admins" ON public.pending_user_registrations;
CREATE POLICY "Pending registrations manageable by admins" ON public.pending_user_registrations
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- 9. Insert default packages
INSERT INTO public.packages (name, description, associated_user_type, price, billing_cycle, max_vehicles, features) 
VALUES
('Basic User', 'Individual user package with limited vehicle access', 'end_user', 0, 'monthly', 5, '["basic_tracking", "mobile_app"]'),
('Sub Admin', 'Fleet management with advanced features', 'sub_admin', 99.99, 'monthly', 50, '["advanced_tracking", "reports", "geofencing", "maintenance_alerts"]')
ON CONFLICT DO NOTHING;

-- 10. Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_package_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_packages_timestamp ON public.packages;
CREATE TRIGGER update_packages_timestamp
  BEFORE UPDATE ON public.packages
  FOR EACH ROW EXECUTE FUNCTION update_package_timestamp();

DROP TRIGGER IF EXISTS update_pending_registrations_timestamp ON public.pending_user_registrations;
CREATE TRIGGER update_pending_registrations_timestamp
  BEFORE UPDATE ON public.pending_user_registrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
