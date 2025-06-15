
-- 1. TIGHTEN RLS POLICIES (Example shown; update other USING (true) with strict policies!) 
-- NOTE: Exact table/policy names should be replaced with your actual policies from search results.

-- Example: Instead of USING (true), restrict selection to owner/admin
DROP POLICY IF EXISTS "Permissive view" ON public.workshop_users;
CREATE POLICY "Workshop user or envio_user can view their data"
  ON public.workshop_users
  FOR SELECT
  USING (
    auth.uid() = envio_user_id OR
    auth.uid() = id OR
    public.has_role(auth.uid(), 'admin')
  );

-- Repeat similar drops/creates for other tables using (true) as appropriate.

-- 2. ADD SECURE PASSWORD STORAGE TO WORKSHOP USERS

ALTER TABLE public.workshop_users
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS password_salt TEXT;

-- 3. REMOVE ANY DEMO OR SAMPLE DATA (examples shown; adapt to your test/demo data discovered in project)

DELETE FROM public.workshop_users WHERE email LIKE '%demo%' OR name LIKE '%demo%';
DELETE FROM public.workshops WHERE email LIKE '%demo%' OR name LIKE '%demo%';

-- 4. PAYMENT WORKFLOW: Add missing status/automation fields to payment/transaction tables

ALTER TABLE public.workshop_transactions
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_error TEXT,
  ADD COLUMN IF NOT EXISTS payment_verified BOOLEAN DEFAULT FALSE;

-- 5. ENHANCE PAYSTACK AUTOMATION: Add webhook event tracking/status (if table exists/needed)
ALTER TABLE public.paystack_settings
  ADD COLUMN IF NOT EXISTS last_webhook_event TEXT,
  ADD COLUMN IF NOT EXISTS last_webhook_status TEXT;

-- 6. (Best practice) Add triggers for updated_at if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
      WHERE tgname = 'workshop_users_updated_at'
  ) THEN
    CREATE TRIGGER workshop_users_updated_at
    BEFORE UPDATE ON public.workshop_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- 7. SAMPLE: Remove using(.single()) from critical app-owned queries: N/A for SQL, code-only step.

