
-- Create table to store daily performance snapshots for referral agents
CREATE TABLE public.agent_performance_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.referral_agents(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    total_referrals INT NOT NULL DEFAULT 0,
    total_signups INT NOT NULL DEFAULT 0,
    total_conversions INT NOT NULL DEFAULT 0, -- e.g., first paid action
    total_commission_earned NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (agent_id, snapshot_date)
);

-- Add a comment explaining the purpose of the table
COMMENT ON TABLE public.agent_performance_snapshots IS 'Stores daily aggregated performance metrics for referral agents to power analytics dashboards.';

-- Enable RLS
ALTER TABLE public.agent_performance_snapshots ENABLE ROW LEVEL SECURITY;

-- Agents can see their own snapshots
CREATE POLICY "Agents can view their own performance snapshots"
ON public.agent_performance_snapshots
FOR SELECT
USING (agent_id = (SELECT id FROM public.referral_agents WHERE user_id = auth.uid()));

-- Admins can manage all snapshots (useful for data backfilling/aggregation jobs)
CREATE POLICY "Admins can manage all performance snapshots"
ON public.agent_performance_snapshots
FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create an RPC function to aggregate and save daily snapshots.
-- This would typically be run by a cron job (e.g., Supabase scheduled function).
CREATE OR REPLACE FUNCTION public.update_agent_performance_snapshots()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.agent_performance_snapshots (
        agent_id,
        snapshot_date,
        total_referrals,
        total_signups,
        total_commission_earned
    )
    SELECT
        ra.id AS agent_id,
        CURRENT_DATE AS snapshot_date,
        COALESCE(SUM(rc.usage_count), 0) AS total_referrals,
        (SELECT COUNT(*) FROM referred_users ru WHERE ru.referring_agent_id = ra.id) AS total_signups,
        (
          SELECT COALESCE(SUM(r_comm.commission_amount), 0) 
          FROM public.referral_commissions r_comm 
          WHERE r_comm.agent_id = ra.id
        ) AS total_commission_earned
    FROM
        public.referral_agents ra
    LEFT JOIN
        public.referral_codes rc ON ra.id = rc.agent_id
    GROUP BY
        ra.id
    ON CONFLICT (agent_id, snapshot_date) DO UPDATE
    SET
        total_referrals = EXCLUDED.total_referrals,
        total_signups = EXCLUDED.total_signups,
        total_commission_earned = EXCLUDED.total_commission_earned;
END;
$$;

COMMENT ON FUNCTION public.update_agent_performance_snapshots() IS 'Aggregates daily performance data for each agent and saves it as a snapshot. Intended for use with a daily cron job.';

