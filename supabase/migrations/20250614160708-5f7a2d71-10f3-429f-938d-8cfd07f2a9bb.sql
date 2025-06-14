
-- 2. Create a table defining which permissions belong to which roles
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (role, permission)
);

-- 3. Table for logging who assigned what role to whom
CREATE TABLE IF NOT EXISTS public.user_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee_user_id UUID NOT NULL,
  assigned_role public.app_role NOT NULL,
  assigned_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Approvals for admin/privileged user creation
CREATE TABLE IF NOT EXISTS public.user_creation_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  requested_role public.app_role NOT NULL,
  requested_by UUID NOT NULL,
  approved_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  request_reason TEXT,
  approval_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Full audit event table
CREATE TABLE IF NOT EXISTS public.security_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  target_user_id UUID,
  detail JSONB,
  ip_address INET,
  user_agent TEXT,
  severity TEXT DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Add RLS policies to each table (for now, admins only)
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read/write role_permissions"
  ON role_permissions
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read/write user_role_assignments"
  ON user_role_assignments
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE user_creation_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read/write user_creation_approvals"
  ON user_creation_approvals
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

ALTER TABLE security_audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read security_audit_events"
  ON security_audit_events
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- 7. Insert sample permissions for clarity
INSERT INTO public.role_permissions (role, permission, description) VALUES
  ('admin', 'create_user',      'Can create other users')
  ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role, permission, description) VALUES
  ('admin', 'assign_role',      'Can assign roles to users')
  ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role, permission, description) VALUES
  ('admin', 'manage_system',    'Can manage system settings')
  ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role, permission, description) VALUES
  ('manager', 'create_user',    'Can invite users')
  ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role, permission, description) VALUES
  ('manager', 'assign_role',    'Can assign limited roles')
  ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role, permission, description) VALUES
  ('fleet_manager', 'view_vehicles', 'View all vehicles')
  ON CONFLICT DO NOTHING;

-- 8. Add a helper function to check granular permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
  )
$$;

-- 9. Trigger for automatic audit events on user role assignments
CREATE OR REPLACE FUNCTION public.log_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.security_audit_events (
    event_type, user_id, target_user_id, detail, severity, created_at
  ) VALUES (
    'role_assigned', NEW.assigned_by, NEW.assignee_user_id,
    jsonb_build_object('role', NEW.assigned_role, 'reason', NEW.reason), 
    'medium', now()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_role_assignment ON public.user_role_assignments;
CREATE TRIGGER trg_log_role_assignment
  AFTER INSERT ON public.user_role_assignments
  FOR EACH ROW EXECUTE FUNCTION public.log_role_assignment();

