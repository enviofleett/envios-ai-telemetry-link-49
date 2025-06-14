
import { supabase } from '@/integrations/supabase/client';
import { getMyAgentProfile } from './agents';
import type { 
  AgentDashboardAnalytics,
  CommissionStatus,
  AgentPerformanceSnapshot,
} from '@/types/referral';

export async function getAgentDashboardAnalytics(): Promise<AgentDashboardAnalytics> {
  const agentProfile = await getMyAgentProfile();
  if (!agentProfile) {
      // Return empty state if not an agent, so page can handle it gracefully.
      return {
          totalEarned: 0,
          pendingCommissions: 0,
          processingPayouts: 0,
          earnedThisMonth: 0,
          earnedLastMonth: 0,
          totalCodes: 0,
          totalUsageCount: 0,
          totalReferredUsers: 0,
          referredUsersThisMonth: 0,
          referredUsersLastMonth: 0,
          monthlyCommissions: Array(6).fill(0).map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - (5 - i));
              return { name: d.toLocaleString('default', { month: 'short' }), total: 0 };
          }),
      };
  }
  const agentId = agentProfile.id;

  // Fetch commissions
  const { data: rawCommissions, error: commissionsError } = await supabase
    .from('referral_commissions')
    .select('commission_amount, status, created_at')
    .eq('agent_id', agentId);
  if (commissionsError) throw commissionsError;

  const commissions = rawCommissions as { commission_amount: number; status: CommissionStatus; created_at: string; }[] | null;

  // Fetch codes
  const { data: codes, error: codesError } = await supabase
    .from('referral_codes')
    .select('usage_count')
    .eq('agent_id', agentId);
  if (codesError) throw codesError;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Fetch referred users count
  const { count: referredUsersCount, error: referredUsersError } = await supabase
    .from('referred_users')
    .select('*', { count: 'exact', head: true })
    .eq('referring_agent_id', agentId);
  if (referredUsersError) throw referredUsersError;

  // Fetch referred users this month
  const { count: referredUsersThisMonth, error: referredUsersThisMonthError } = await supabase
    .from('referred_users')
    .select('*', { count: 'exact', head: true })
    .eq('referring_agent_id', agentId)
    .gte('signed_up_at', startOfMonth.toISOString());
  if (referredUsersThisMonthError) throw referredUsersThisMonthError;
  
  // Fetch referred users last month
  const { count: referredUsersLastMonth, error: referredUsersLastMonthError } = await supabase
    .from('referred_users')
    .select('*', { count: 'exact', head: true })
    .eq('referring_agent_id', agentId)
    .gte('signed_up_at', startOfLastMonth.toISOString())
    .lt('signed_up_at', startOfMonth.toISOString());
  if (referredUsersLastMonthError) throw referredUsersLastMonthError;


  const totalEarned = (commissions ?? [])
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.commission_amount, 0);
    
  const pendingCommissions = (commissions ?? [])
    .filter(c => c.status === 'pending_payout')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const processingPayouts = (commissions ?? [])
    .filter(c => c.status === 'processing_payout')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const earnedThisMonth = (commissions ?? [])
      .filter(c => (c.status === 'paid' || c.status === 'processing_payout' || c.status === 'pending_payout') && new Date(c.created_at) >= startOfMonth)
      .reduce((sum, c) => sum + c.commission_amount, 0);

  const earnedLastMonth = (commissions ?? [])
    .filter(c => (c.status === 'paid' || c.status === 'processing_payout' || c.status === 'pending_payout') && new Date(c.created_at) >= startOfLastMonth && new Date(c.created_at) < startOfMonth)
    .reduce((sum, c) => sum + c.commission_amount, 0);
  
  const totalUsageCount = (codes ?? []).reduce((sum, c) => sum + c.usage_count, 0);

  // Data for chart (commissions in the last 6 months)
  const monthlyCommissions: { name: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString('default', { month: 'short' });
      
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const total = (commissions ?? [])
          .filter(c => (c.status === 'paid') && new Date(c.created_at) >= monthStart && new Date(c.created_at) <= monthEnd)
          .reduce((sum, c) => sum + c.commission_amount, 0);
      
      monthlyCommissions.push({ name: month, total });
  }

  return {
    totalEarned,
    pendingCommissions,
    processingPayouts,
    earnedThisMonth,
    earnedLastMonth,
    totalCodes: (codes ?? []).length,
    totalUsageCount,
    totalReferredUsers: referredUsersCount ?? 0,
    referredUsersThisMonth: referredUsersThisMonth ?? 0,
    referredUsersLastMonth: referredUsersLastMonth ?? 0,
    monthlyCommissions,
  };
}

export async function getAgentPerformanceSnapshots(): Promise<AgentPerformanceSnapshot[]> {
  const agentProfile = await getMyAgentProfile();
  if (!agentProfile) return [];

  const { data, error } = await supabase
    .from('agent_performance_snapshots')
    .select('*')
    .eq('agent_id', agentProfile.id)
    .order('snapshot_date', { ascending: false })
    .limit(30); // Fetch last 30 days of snapshots

  if (error) {
    console.error('Error fetching performance snapshots:', error);
    throw error;
  }

  return data || [];
}
