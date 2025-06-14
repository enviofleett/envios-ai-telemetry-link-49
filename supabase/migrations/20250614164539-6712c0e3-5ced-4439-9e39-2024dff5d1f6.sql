
-- Step 1: Create a SECURITY DEFINER function to check if the user is a super_admin or system_admin

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admin_users pau
    JOIN public.platform_admin_roles par ON par.admin_user_id = pau.id
    WHERE pau.user_id = _user_id
      AND par.role IN ('super_admin', 'system_admin')
  );
$$;

-- Step 2: Drop the potentially recursive/circular policies on platform_admin_users and platform_admin_roles

DROP POLICY IF EXISTS "Super & System Admins can read admin users" ON public.platform_admin_users;
DROP POLICY IF EXISTS "Super & System Admins can write admin users" ON public.platform_admin_users;
DROP POLICY IF EXISTS "Super & System Admins can read admin roles" ON public.platform_admin_roles;
DROP POLICY IF EXISTS "Super & System Admins can write admin roles" ON public.platform_admin_roles;

-- Step 3: Create new policies using the function

-- Allow super_admin & system_admin to read all platform_admin_users
CREATE POLICY "Platform admins can view all admin users"
  ON public.platform_admin_users FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

-- Allow super_admin & system_admin to update all platform_admin_users
CREATE POLICY "Platform admins can update all admin users"
  ON public.platform_admin_users FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

-- Allow super_admin & system_admin to insert admin users
CREATE POLICY "Platform admins can insert admin users"
  ON public.platform_admin_users FOR INSERT
  WITH CHECK (public.is_platform_admin(auth.uid()));

-- Allow super_admin & system_admin to delete admin users
CREATE POLICY "Platform admins can delete admin users"
  ON public.platform_admin_users FOR DELETE
  USING (public.is_platform_admin(auth.uid()));

-- ALLOW simple SELECT for a user's own platform_admin_users row (e.g. for their own admin view)
CREATE POLICY "Admin users can see themselves"
  ON public.platform_admin_users FOR SELECT
  USING (user_id = auth.uid());

-- Repeat for platform_admin_roles

CREATE POLICY "Platform admins can view all admin roles"
  ON public.platform_admin_roles FOR SELECT
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can update all admin roles"
  ON public.platform_admin_roles FOR UPDATE
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can insert admin roles"
  ON public.platform_admin_roles FOR INSERT
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete admin roles"
  ON public.platform_admin_roles FOR DELETE
  USING (public.is_platform_admin(auth.uid()));

-- For safety, allow an admin user to view their own assigned roles
CREATE POLICY "Admins can view their own admin roles"
  ON public.platform_admin_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admin_users
      WHERE id = admin_user_id AND user_id = auth.uid()
    )
  );

-- Step 4: Make sure RLS is enabled (already enabled, but restate for safety)
ALTER TABLE public.platform_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admin_roles ENABLE ROW LEVEL SECURITY;

-- End of SQL plan.
