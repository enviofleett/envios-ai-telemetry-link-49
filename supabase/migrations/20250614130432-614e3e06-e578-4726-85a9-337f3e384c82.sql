
-- 1. Ensure vehicle_limit exists on subscriber_packages (skip if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
      WHERE table_name='subscriber_packages' AND column_name='vehicle_limit'
  ) THEN
    ALTER TABLE public.subscriber_packages ADD COLUMN vehicle_limit INTEGER DEFAULT NULL;
  END IF;
END $$;

-- 2. Package versioning (for advanced admin flows)
CREATE TABLE IF NOT EXISTS public.package_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES subscriber_packages(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  changes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(package_id, version_number)
);

-- 3. Subscription migration logs
CREATE TABLE IF NOT EXISTS public.subscription_migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  previous_package_id UUID REFERENCES subscriber_packages(id),
  new_package_id UUID REFERENCES subscriber_packages(id),
  migrated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  migrated_by UUID,
  notes TEXT
);

-- 4. Package analytics aggregation table (for dashboards)
CREATE TABLE IF NOT EXISTS public.package_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES subscriber_packages(id) ON DELETE CASCADE,
  subscribers_count INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security policies for new tables:
ALTER TABLE public.package_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_migration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_analytics ENABLE ROW LEVEL SECURITY;

-- Allow only admin users (role) to interact with these tables
CREATE POLICY "Admins manage package versions"
  ON public.package_versions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage subscription migrations"
  ON public.subscription_migration_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage package analytics"
  ON public.package_analytics FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
