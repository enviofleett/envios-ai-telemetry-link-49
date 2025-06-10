
-- Create workshop permissions table for role-based access control
CREATE TABLE public.workshop_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES envio_users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'technician', 'inspector')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  assigned_by UUID REFERENCES envio_users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workshop_id, user_id)
);

-- Create inspection form templates table
CREATE TABLE public.inspection_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_description TEXT,
  vehicle_category TEXT,
  form_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES envio_users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workshop transactions table for payment tracking
CREATE TABLE public.workshop_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES envio_users(id),
  vehicle_id UUID REFERENCES vehicles(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('connection_fee', 'activation_fee', 'service_fee', 'inspection_fee')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  service_description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workshop approval logs table for audit trail
CREATE TABLE public.workshop_approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID REFERENCES workshops(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'suspended', 'reactivated')),
  notes TEXT,
  performed_by UUID REFERENCES envio_users(id),
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inspector assignments table
CREATE TABLE public.inspector_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES vehicle_inspections(id) ON DELETE CASCADE,
  inspector_id UUID REFERENCES envio_users(id),
  assigned_by UUID REFERENCES envio_users(id),
  assignment_status TEXT NOT NULL DEFAULT 'assigned' CHECK (assignment_status IN ('assigned', 'accepted', 'declined', 'completed')),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.workshop_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_approval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspector_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workshop_permissions
CREATE POLICY "Workshop owners and managers can manage permissions"
  ON public.workshop_permissions
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM workshop_permissions 
      WHERE workshop_id = workshop_permissions.workshop_id 
      AND role IN ('owner', 'manager') 
      AND is_active = true
    )
  );

CREATE POLICY "Users can view their own permissions"
  ON public.workshop_permissions
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for inspection_form_templates
CREATE POLICY "Workshop staff can manage templates"
  ON public.inspection_form_templates
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM workshop_permissions 
      WHERE workshop_id = inspection_form_templates.workshop_id 
      AND is_active = true
    )
  );

-- RLS Policies for workshop_transactions
CREATE POLICY "Workshop staff can view transactions"
  ON public.workshop_transactions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM workshop_permissions 
      WHERE workshop_id = workshop_transactions.workshop_id 
      AND is_active = true
    ) OR auth.uid() = customer_id
  );

CREATE POLICY "Workshop owners and managers can manage transactions"
  ON public.workshop_transactions
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM workshop_permissions 
      WHERE workshop_id = workshop_transactions.workshop_id 
      AND role IN ('owner', 'manager') 
      AND is_active = true
    )
  );

-- RLS Policies for workshop_approval_logs
CREATE POLICY "Admins can manage approval logs"
  ON public.workshop_approval_logs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- RLS Policies for inspector_assignments
CREATE POLICY "Workshop staff and assigned inspectors can view assignments"
  ON public.inspector_assignments
  FOR SELECT
  USING (
    auth.uid() = inspector_id OR 
    auth.uid() = assigned_by OR
    auth.uid() IN (
      SELECT wp.user_id FROM workshop_permissions wp
      JOIN vehicle_inspections vi ON vi.workshop_id = wp.workshop_id
      WHERE vi.id = inspector_assignments.inspection_id
      AND wp.is_active = true
    )
  );

CREATE POLICY "Workshop managers can manage inspector assignments"
  ON public.inspector_assignments
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT wp.user_id FROM workshop_permissions wp
      JOIN vehicle_inspections vi ON vi.workshop_id = wp.workshop_id
      WHERE vi.id = inspector_assignments.inspection_id
      AND wp.role IN ('owner', 'manager')
      AND wp.is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX idx_workshop_permissions_workshop_user ON workshop_permissions(workshop_id, user_id);
CREATE INDEX idx_workshop_permissions_role ON workshop_permissions(role) WHERE is_active = true;
CREATE INDEX idx_inspection_form_templates_workshop ON inspection_form_templates(workshop_id) WHERE is_active = true;
CREATE INDEX idx_workshop_transactions_workshop ON workshop_transactions(workshop_id);
CREATE INDEX idx_workshop_transactions_status ON workshop_transactions(payment_status);
CREATE INDEX idx_workshop_approval_logs_workshop ON workshop_approval_logs(workshop_id);
CREATE INDEX idx_inspector_assignments_inspection ON inspector_assignments(inspection_id);
CREATE INDEX idx_inspector_assignments_inspector ON inspector_assignments(inspector_id);

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workshop_permissions_updated_at 
  BEFORE UPDATE ON workshop_permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_form_templates_updated_at 
  BEFORE UPDATE ON inspection_form_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workshop_transactions_updated_at 
  BEFORE UPDATE ON workshop_transactions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
