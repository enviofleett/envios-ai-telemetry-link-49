
import { supabase } from '@/integrations/supabase/client';
import type { 
  ReferralCode, 
  ReferralAgent, 
  ReferralAgentWithUserDetails, 
  ReferralAgentStatus, 
  AgentDashboardAnalytics,
  ReferredUserWithDetails,
  ReferredUser,
  CommissionWithDetails,
  ReferralCommission
} from '@/types/referral';

export const referralApi = {
  async getReferralAgents(): Promise<ReferralAgentWithUserDetails[]> {
    const { data: agents, error: agentsError } = await supabase.from('referral_agents').select('*');
    if (agentsError) throw agentsError;

    if (!agents || agents.length === 0) {
      return [];
    }

    const userIds = agents.map(a => a.user_id);
    
    const { data: users, error: usersError } = await supabase
      .from('envio_users')
      .select('id, name, email')
      .in('id', userIds);
      
    if (usersError) throw usersError;

    const usersById = new Map(users.map(u => [u.id, u]));

    return agents.map(agent => ({
        ...agent,
        name: usersById.get(agent.user_id)?.name ?? 'Unknown User',
        email: usersById.get(agent.user_id)?.email ?? 'no-email@example.com',
    }));
  },

  async getMyAgentProfile(): Promise<ReferralAgent | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('referral_agents')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching agent profile:", error);
      throw error;
    }
    return data;
  },

  async updateMyAgentProfile(
    details: { bank_account_details?: any }
  ): Promise<ReferralAgent> {
    const agentProfile = await this.getMyAgentProfile();
    if (!agentProfile) throw new Error("Agent profile not found.");

    const { data, error } = await supabase
      .from('referral_agents')
      .update({
        bank_account_details: details.bank_account_details,
        updated_at: new Date().toISOString()
      })
      .eq('id', agentProfile.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update profile.");
    
    return data;
  },

  async getAgentDashboardAnalytics(): Promise<AgentDashboardAnalytics> {
    const agentProfile = await this.getMyAgentProfile();
    if (!agentProfile) {
        // Return empty state if not an agent, so page can handle it gracefully.
        return {
            totalEarned: 0,
            pendingCommissions: 0,
            earnedThisMonth: 0,
            totalCodes: 0,
            totalUsageCount: 0,
            totalReferredUsers: 0,
            monthlyCommissions: Array(6).fill(0).map((_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (5 - i));
                return { name: d.toLocaleString('default', { month: 'short' }), total: 0 };
            }),
        };
    }
    const agentId = agentProfile.id;

    // Fetch commissions
    const { data: commissions, error: commissionsError } = await supabase
      .from('referral_commissions')
      .select('commission_amount, status, created_at')
      .eq('agent_id', agentId);
    if (commissionsError) throw commissionsError;

    // Fetch codes
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select('usage_count')
      .eq('agent_id', agentId);
    if (codesError) throw codesError;

    // Fetch referred users count
    const { count: referredUsersCount, error: referredUsersError } = await supabase
      .from('referred_users')
      .select('*', { count: 'exact', head: true })
      .eq('referring_agent_id', agentId);
    if (referredUsersError) throw referredUsersError;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalEarned = (commissions ?? [])
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.commission_amount, 0);
      
    const pendingCommissions = (commissions ?? [])
      .filter(c => c.status === 'pending_payout')
      .reduce((sum, c) => sum + c.commission_amount, 0);

    const earnedThisMonth = (commissions ?? [])
        .filter(c => c.status === 'paid' && new Date(c.created_at) >= startOfMonth)
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
            .filter(c => c.status === 'paid' && new Date(c.created_at) >= monthStart && new Date(c.created_at) <= monthEnd)
            .reduce((sum, c) => sum + c.commission_amount, 0);
        
        monthlyCommissions.push({ name: month, total });
    }

    return {
      totalEarned,
      pendingCommissions,
      earnedThisMonth,
      totalCodes: (codes ?? []).length,
      totalUsageCount,
      totalReferredUsers: referredUsersCount ?? 0,
      monthlyCommissions,
    };
  },

  async getReferredUsers(): Promise<ReferredUserWithDetails[]> {
    const agentProfile = await this.getMyAgentProfile();
    if (!agentProfile) return [];

    const { data: referred, error } = await supabase
        .from('referred_users')
        .select('*, referral_codes(code)')
        .eq('referring_agent_id', agentProfile.id)
        .order('signed_up_at', { ascending: false });

    if (error) {
        console.error("Error fetching referred users:", error);
        throw error;
    }
    if (!referred || referred.length === 0) return [];

    const userIds = referred.map(r => r.referred_user_id);
    const { data: users, error: usersError } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .in('id', userIds);
    
    if (usersError) {
        console.error("Error fetching user details for referred users:", usersError);
        throw usersError;
    }
    const usersById = new Map((users ?? []).map(u => [u.id, u]));

    return referred.map(r => {
        const referralCodeData = r.referral_codes as { code: string } | null;
        const referralCode = referralCodeData ? referralCodeData.code : 'Direct Signup';
        
        return {
            ...(r as Omit<ReferredUser, 'id'>),
            id: r.id,
            referred_user_name: usersById.get(r.referred_user_id)?.name ?? 'Unknown User',
            referred_user_email: usersById.get(r.referred_user_id)?.email ?? 'No Email',
            referral_code: referralCode,
        };
    });
  },

  async getCommissionHistory(): Promise<CommissionWithDetails[]> {
    const agentProfile = await this.getMyAgentProfile();
    if (!agentProfile) return [];

    const { data: commissions, error } = await supabase
      .from('referral_commissions')
      .select('*')
      .eq('agent_id', agentProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching commissions:', error);
      throw error;
    }
    if (!commissions || commissions.length === 0) return [];

    const userIds = [...new Set(commissions.map(c => c.referred_user_id))];
    if (userIds.length === 0) {
        return commissions.map(c => ({
            ...c,
            referred_user_name: 'N/A'
        }));
    }
    
    const { data: users, error: usersError } = await supabase
      .from('envio_users')
      .select('id, name')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching user details for commissions:', usersError);
      throw usersError;
    }
    const usersById = new Map((users ?? []).map(u => [u.id, u]));

    return commissions.map(c => ({
      ...c,
      referred_user_name: usersById.get(c.referred_user_id)?.name ?? 'Unknown User',
    }));
  },

  async getReferralCodes(): Promise<ReferralCode[]> {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createReferralCode(
    codeData: { code: string; agent_id: string; }
  ): Promise<ReferralCode> {
    const { data, error } = await supabase
      .from('referral_codes')
      .insert(codeData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateReferralAgentStatus(
    agentId: string,
    status: ReferralAgentStatus
  ): Promise<ReferralAgent> {
    const { data, error } = await supabase
      .from('referral_agents')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', agentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
