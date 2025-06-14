
-- 1. Get the user id from Supabase auth.users
--    (You should confirm the user_id is correct—if not, adjust below.)
--    For this migration, we assume the user is already present in auth.users.

-- 2. Insert the user into platform_admin_users if not already present.
INSERT INTO public.platform_admin_users (user_id, email, display_name)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name'
FROM auth.users au
WHERE au.email = 'chudesyl@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.platform_admin_users pau WHERE pau.user_id = au.id
  );

-- 3. Assign the super_admin role to this admin user
INSERT INTO public.platform_admin_roles (admin_user_id, role)
SELECT
  pau.id,
  'super_admin'
FROM public.platform_admin_users pau
JOIN auth.users au ON pau.user_id = au.id
WHERE au.email = 'chudesyl@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.platform_admin_roles par
    WHERE par.admin_user_id = pau.id AND par.role = 'super_admin'
  );

