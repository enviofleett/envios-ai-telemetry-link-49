
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import type { GP51Session } from './types.ts';

export function createSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  );
}

export async function saveGP51Session(username: string, token: string) {
  const supabase = createSupabaseClient();
  
  const { data: sessionData, error: sessionError } = await supabase
    .from('gp51_sessions')
    .upsert({
      username: username,
      gp51_token: token,
      token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, {
      onConflict: 'username'
    })
    .select()
    .single();

  if (sessionError) {
    console.error('Failed to store GP51 session in database:', sessionError);
    throw new Error(`Failed to save GP51 session to database: ${sessionError.message}`);
  }

  console.log('GP51 session stored successfully in database');
  return sessionData;
}

export async function getGP51Status() {
  const supabase = createSupabaseClient();
  
  const { data: sessions, error } = await supabase
    .from('gp51_sessions')
    .select('username, token_expires_at, gp51_token')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Failed to query GP51 sessions:', error);
    throw new Error(`Failed to check GP51 status: ${error.message}`);
  }

  const hasActiveSession = sessions && sessions.length > 0 && 
    new Date(sessions[0].token_expires_at) > new Date() &&
    sessions[0].gp51_token;

  console.log('GP51 status check result:', {
    sessionsFound: sessions?.length || 0,
    hasActiveSession,
    expiresAt: sessions?.[0]?.token_expires_at
  });

  return {
    connected: hasActiveSession,
    username: hasActiveSession ? sessions[0].username : null,
    expiresAt: hasActiveSession ? sessions[0].token_expires_at : null
  };
}
