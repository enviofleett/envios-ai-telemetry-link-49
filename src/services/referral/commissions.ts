
import { supabase } from '@/integrations/supabase/client';
import { getMyAgentProfile } from './agents';
import type { 
  CommissionWithDetails,
  AgentPayoutRequest,
} from '@/types/referral';

export async function getCommissionHistory(): Promise<CommissionWithDetails[]> {
  const agentProfile = await getMyAgentProfile();
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
}

export async function createPayoutRequest(
  amount: number,
  commissionIds: string[]
): Promise<string> {
  const { data, error } = await supabase.rpc('create_payout_request', {
    request_amount: amount,
    commission_ids: commissionIds,
  });

  if (error) {
    console.error('Error creating payout request:', error);
    throw error;
  }
  if(!data) throw new Error("Payout request failed.");
  return data;
}

export async function getMyPayoutRequests(): Promise<AgentPayoutRequest[]> {
  const agentProfile = await getMyAgentProfile();
  if (!agentProfile) return [];

  const { data, error } = await supabase
    .from('agent_payout_requests')
    .select('*')
    .eq('agent_id', agentProfile.id)
    .order('requested_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching payout requests:', error);
    throw error;
  }

  return data || [];
}
