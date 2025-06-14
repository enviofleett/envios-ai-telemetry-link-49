
CREATE OR REPLACE FUNCTION public.update_agent_performance_snapshots()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO public.agent_performance_snapshots (
        agent_id,
        snapshot_date,
        total_referrals,
        total_signups,
        total_conversions,
        total_commission_earned
    )
    SELECT
        ra.id AS agent_id,
        CURRENT_DATE AS snapshot_date,
        COALESCE(SUM(rc.usage_count), 0) AS total_referrals,
        (SELECT COUNT(*) FROM referred_users ru WHERE ru.referring_agent_id = ra.id) AS total_signups,
        (SELECT COUNT(*) FROM referral_commissions r_comm WHERE r_comm.agent_id = ra.id) AS total_conversions,
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
        total_conversions = EXCLUDED.total_conversions,
        total_commission_earned = EXCLUDED.total_commission_earned;
END;
$function$
