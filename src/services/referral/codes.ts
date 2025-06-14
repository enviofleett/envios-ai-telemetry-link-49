
import { supabase } from '@/integrations/supabase/client';
import type { 
  ReferralCode,
} from '@/types/referral';

export async function getReferralCodes(): Promise<ReferralCode[]> {
  const { data, error } = await supabase
    .from('referral_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createReferralCode(
  codeData: { code: string; agent_id: string; }
): Promise<ReferralCode> {
  const { data, error } = await supabase
    .from('referral_codes')
    .insert(codeData)
    .select()
    .single();

  if (error) throw error;
  return data;
}
