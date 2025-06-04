
import { createClient } from '@supabase/supabase-js';
import { getEnvironment } from './environment.ts';

export async function getSupabaseAdminClient() {
  const env = getEnvironment();
    
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      },
    },
  });
}
