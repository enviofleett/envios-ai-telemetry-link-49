
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function isUserAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .rpc('has_role', { _user_id: userId, _role: 'admin' });
  return data === true;
}

export async function getCurrentUser(supabase: any, authHeader: string | null) {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  return user?.id || null;
}
