
-- Create a new enum for platform admin roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'admin_role') THEN
    CREATE TYPE public.admin_role AS ENUM ('super_admin', 'system_admin', 'support_admin');
  END IF;
END$$;

-- Platform admin users table (tied to supabase auth.users)
CREATE TABLE IF NOT EXISTS public.platform_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE, -- references auth.users(id)
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin roles assignment table
CREATE TABLE IF NOT EXISTS public.platform_admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.platform_admin_users(id) ON DELETE CASCADE,
  role public.admin_role NOT NULL,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (admin_user_id, role)
);

-- Admin permissions for platform-level control
CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.admin_role NOT NULL,
  permission TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (role, permission)
);

-- Enable RLS for extra security (for future code migration)
ALTER TABLE public.platform_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Only super_admin & system_admin can read/write admin users/roles
CREATE POLICY "Super & System Admins can read admin users"
  ON public.platform_admin_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admin_roles 
      WHERE admin_user_id = (SELECT id FROM public.platform_admin_users WHERE user_id = auth.uid())
      AND role IN ('super_admin', 'system_admin')
    )
  );

CREATE POLICY "Super & System Admins can write admin users"
  ON public.platform_admin_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admin_roles 
      WHERE admin_user_id = (SELECT id FROM public.platform_admin_users WHERE user_id = auth.uid())
      AND role IN ('super_admin', 'system_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_admin_roles 
      WHERE admin_user_id = (SELECT id FROM public.platform_admin_users WHERE user_id = auth.uid())
      AND role IN ('super_admin', 'system_admin')
    )
  );

-- Seed basic admin permissions per role (optional, for example)
INSERT INTO public.admin_permissions (role, permission, description) VALUES
  ('super_admin', 'manage_admins', 'Can add/edit/remove platform admins')
  ON CONFLICT DO NOTHING;
INSERT INTO public.admin_permissions (role, permission, description) VALUES
  ('super_admin', 'manage_system_settings', 'Full system settings access')
  ON CONFLICT DO NOTHING;
INSERT INTO public.admin_permissions (role, permission, description) VALUES
  ('system_admin', 'manage_system_settings', 'Can update system settings')
  ON CONFLICT DO NOTHING;
INSERT INTO public.admin_permissions (role, permission, description) VALUES
  ('support_admin', 'view_logs', 'Can view audit and error logs')
  ON CONFLICT DO NOTHING;

