
import { supabase } from '@/integrations/supabase/client';
import type { SystemReferralAnalytics, TopAgent } from '@/types/referral';

interface EnvioUser {
  id: string;
  name: string;
  email: string;
}

export async function getSystemReferralAnalytics(): Promise<SystemReferralAnalytics> {
    // 1. Get latest snapshot date
    const { data: latestSnapshotDateData, error: latestSnapshotDateError } = await supabase
        .from('agent_performance_snapshots')
        .select('snapshot_date')
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (latestSnapshotDateError) {
        console.error('Error fetching latest snapshot date:', latestSnapshotDateError);
        throw latestSnapshotDateError;
    }

    const emptyState = {
        total_referrals: 0,
        total_signups: 0,
        total_conversions: 0,
        total_commission: 0,
        top_agents: [],
    };

    if (!latestSnapshotDateData) {
        return emptyState;
    }

    const latestDate = latestSnapshotDateData.snapshot_date;

    // 2. Get all snapshots for the latest date and total commission
    const [{ data: snapshots, error: snapshotsError }, { data: commissions, error: commissionsError }] = await Promise.all([
        supabase
            .from('agent_performance_snapshots')
            .select('total_referrals, total_signups, total_conversions')
            .eq('snapshot_date', latestDate),
        supabase
            .from('referral_commissions')
            .select('agent_id, commission_amount')
            .in('status', ['paid', 'pending_payout', 'processing_payout'])
    ]);

    if (snapshotsError) {
        console.error('Error fetching snapshots:', snapshotsError);
        throw snapshotsError;
    }
    if (commissionsError) {
        console.error('Error fetching commissions:', commissionsError);
        throw commissionsError;
    }

    const funnel = (snapshots || []).reduce(
        (acc, s) => {
            acc.total_referrals += s.total_referrals;
            acc.total_signups += s.total_signups;
            acc.total_conversions += s.total_conversions;
            return acc;
        },
        { total_referrals: 0, total_signups: 0, total_conversions: 0 }
    );

    const total_commission = (commissions || []).reduce((sum, c) => sum + c.commission_amount, 0);

    // 4. Calculate top agents
    const commissionsByAgent = (commissions || []).reduce<Record<string, number>>((acc, comm) => {
        if(comm.agent_id) {
            if (!acc[comm.agent_id]) {
                acc[comm.agent_id] = 0;
            }
            acc[comm.agent_id] += comm.commission_amount;
        }
        return acc;
    }, {});

    const sortedAgentIds = Object.keys(commissionsByAgent).sort(
        (a, b) => commissionsByAgent[b] - commissionsByAgent[a]
    ).slice(0, 5);

    if (sortedAgentIds.length === 0) {
        return {
            ...funnel,
            total_commission,
            top_agents: [],
        };
    }
    
    // 5. Get agent details for top agents
    const { data: topAgentsData, error: topAgentsError } = await supabase
        .from('referral_agents')
        .select('id, user_id')
        .in('id', sortedAgentIds);

    if (topAgentsError) {
        console.error('Error fetching top agents:', topAgentsError);
        throw topAgentsError;
    }

    const userIds = (topAgentsData || []).map(a => a.user_id);
    
    const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .in('id', userIds);

    if (usersError) {
        console.error('Error fetching users:', usersError);
        throw usersError;
    }
    
    const usersById = new Map((users || []).map(u => [u.id, u as EnvioUser]));
    const agentsById = new Map((topAgentsData || []).map(a => [a.id, a]));

    const top_agents: TopAgent[] = sortedAgentIds.map(agentId => {
        const agent = agentsById.get(agentId);
        const user = agent ? usersById.get(agent.user_id) : undefined;
        return {
            agent_id: agentId,
            agent_name: user?.name ?? 'Unknown Agent',
            agent_email: user?.email ?? 'N/A',
            total_commission: commissionsByAgent[agentId]
        }
    });

    return {
        ...funnel,
        total_commission,
        top_agents,
    };
}
