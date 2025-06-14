
import { supabase } from '@/integrations/supabase/client';
import { getMyAgentProfile } from './agents';
import type { 
  ReferredUserWithDetails,
  ReferredUser,
} from '@/types/referral';

export async function getReferredUsers(): Promise<ReferredUserWithDetails[]> {
  const agentProfile = await getMyAgentProfile();
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
}
