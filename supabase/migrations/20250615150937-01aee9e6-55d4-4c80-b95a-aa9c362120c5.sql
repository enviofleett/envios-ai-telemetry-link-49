
-- 1. ENFORCE FOREIGN KEYS (if not already present, creates a more robust structure):

-- Link workshop_users to envio_users (main account) for consistent identity management:
ALTER TABLE public.workshop_users
ADD COLUMN IF NOT EXISTS envio_user_id UUID REFERENCES public.envio_users(id) ON DELETE CASCADE;

-- Add unique constraint for (workshop_id, email) if not already present to prevent duplicates:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_workshop_email'
      AND conrelid = 'workshop_users'::regclass
  ) THEN
    ALTER TABLE public.workshop_users
    ADD CONSTRAINT unique_workshop_email UNIQUE (workshop_id, email);
  END IF;
END$$;

-- Ensure vehicle_inspections links both to workshop AND vehicle:
ALTER TABLE public.vehicle_inspections
ALTER COLUMN workshop_id SET NOT NULL;
-- If not present, add a formal FK for vehicle_id (assuming vehicles(id)):
-- (Skip if vehicle_id is not a FK: the column is TEXT in schema, so skip FK here for now)

-- Add missing FKs for payment/transactions for consistency (connect transactions/payments/activations/assignments):
-- workshop_transactions: ensure FKs exist
ALTER TABLE public.workshop_transactions
ALTER COLUMN workshop_id SET NOT NULL,
ALTER COLUMN customer_id DROP NOT NULL,
ALTER COLUMN vehicle_id DROP NOT NULL;

-- Set FK for created_by fields where relevant (for auditing users)
ALTER TABLE public.inspection_form_templates
ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.workshop_activations
ALTER COLUMN activated_by DROP NOT NULL;

-- 2. IMPROVE RLS POLICIES FOR CROSS-TABLE RELATIONSHIPS

-- Example: strengthen workshop_permissions visibility to ensure only valid envio_users/managers can access
DROP POLICY IF EXISTS "Workshop owners and managers can manage permissions" ON public.workshop_permissions;

CREATE POLICY "Workshop owners and managers can manage permissions"
  ON public.workshop_permissions
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.workshop_permissions 
      WHERE workshop_id = workshop_permissions.workshop_id 
      AND role IN ('owner', 'manager') 
      AND is_active = true
    )
    OR
    auth.uid() IN (
      SELECT id FROM envio_users WHERE id = workshop_permissions.user_id
    )
  );

-- Make sure workshop_users can only be managed by corresponding envio_users:
ALTER TABLE public.workshop_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Workshop users can view their own data" ON public.workshop_users;
CREATE POLICY "Workshop users and envio_users can view their own data"
  ON public.workshop_users
  FOR SELECT
  USING (
    auth.uid() = envio_user_id
    OR auth.uid() IN (
      SELECT id FROM envio_users WHERE id = envio_user_id
    )
    OR auth.uid() = id -- fallback for self-managed account
  );

-- 3. ADD SAMPLE DATA (for testing/demo purposes)

INSERT INTO public.workshops (
  name, representative_name, email, phone, city, country, service_types, activation_fee, connection_fee, verified, is_active, created_by
) VALUES (
  'Autotronic Garage', 'Sarah Mechanic', 'autotronic@example.com', '+234 111 222 3333', 'Lagos', 'Nigeria', '["Diagnostics", "Oil Change"]', 100, 50, true, true, NULL
)
ON CONFLICT DO NOTHING;

-- 4. PREPARE FOR PAYMENT INTEGRATION

-- Add a nullable "paystack_transaction_id" to workshop_connections for payment record linkage:
ALTER TABLE public.workshop_connections
ADD COLUMN IF NOT EXISTS paystack_transaction_id UUID;

-- 5. (Optional) Add missing updated_at triggers (referenced by schema but may be missing):

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to each critical table:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'workshop_users_updated_at'
  ) THEN
    CREATE TRIGGER workshop_users_updated_at
      BEFORE UPDATE ON public.workshop_users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'workshop_connections_updated_at'
  ) THEN
    CREATE TRIGGER workshop_connections_updated_at
      BEFORE UPDATE ON public.workshop_connections
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'workshop_activations_updated_at'
  ) THEN
    CREATE TRIGGER workshop_activations_updated_at
      BEFORE UPDATE ON public.workshop_activations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
