
-- Create referral_codes table for discount code management (if not exists)
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id),
  discount_percentage numeric NOT NULL CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create package_menu_permissions table for package-menu relationships (if not exists)
CREATE TABLE IF NOT EXISTS public.package_menu_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id uuid NOT NULL REFERENCES public.subscriber_packages(id) ON DELETE CASCADE,
  menu_permission_id uuid NOT NULL REFERENCES public.menu_permissions(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(package_id, menu_permission_id)
);

-- Add missing columns to subscriber_packages if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriber_packages' AND column_name = 'referral_discount_percentage') THEN
    ALTER TABLE public.subscriber_packages ADD COLUMN referral_discount_percentage numeric DEFAULT 0 CHECK (referral_discount_percentage >= 0 AND referral_discount_percentage <= 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriber_packages' AND column_name = 'created_by') THEN
    ALTER TABLE public.subscriber_packages ADD COLUMN created_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create indexes for performance optimization (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_menu_permissions_menu_code ON public.menu_permissions(menu_code);
CREATE INDEX IF NOT EXISTS idx_menu_permissions_parent ON public.menu_permissions(parent_menu_code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_active ON public.referral_codes(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_package_feature_assignments_package ON public.package_feature_assignments(package_id);
CREATE INDEX IF NOT EXISTS idx_package_menu_permissions_package ON public.package_menu_permissions(package_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_package_id ON public.user_subscriptions(package_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(subscription_status);

-- Enable RLS on tables that might not have it enabled
DO $$
BEGIN
  -- Enable RLS on referral_codes if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'referral_codes' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Enable RLS on package_menu_permissions if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'package_menu_permissions' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.package_menu_permissions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies (with DROP IF EXISTS to handle existing policies)
DROP POLICY IF EXISTS "Admins can manage referral codes" ON public.referral_codes;
CREATE POLICY "Admins can manage referral codes" ON public.referral_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view active referral codes" ON public.referral_codes;
CREATE POLICY "Users can view active referral codes" ON public.referral_codes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage package menu permissions" ON public.package_menu_permissions;
CREATE POLICY "Admins can manage package menu permissions" ON public.package_menu_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create triggers for updated_at timestamps (drop and recreate to ensure they exist)
DROP TRIGGER IF EXISTS update_referral_codes_updated_at ON public.referral_codes;
CREATE TRIGGER update_referral_codes_updated_at 
  BEFORE UPDATE ON public.referral_codes 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample referral codes (only if they don't exist)
INSERT INTO public.referral_codes (code, discount_percentage, usage_limit, is_active) VALUES
('WELCOME10', 10, 100, true),
('NEWCUSTOMER15', 15, 50, true),
('PREMIUM20', 20, 25, true)
ON CONFLICT (code) DO NOTHING;
