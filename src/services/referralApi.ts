import { supabase } from '@/integrations/supabase/client';
import type { ReferralCode, ReferralAgent, ReferralAgentWithUserDetails, ReferralAgentStatus } from '@/types/referral';

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
