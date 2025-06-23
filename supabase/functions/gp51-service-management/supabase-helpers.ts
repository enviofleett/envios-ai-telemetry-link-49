
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { errorResponse } from './response-helpers.ts';

export async function getLatestGp51Session(supabase: SupabaseClient) {
  try {
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Database error fetching GP51 sessions:', error);
      return { 
        session: null, 
        error: true, 
        response: errorResponse(`Database error: ${error.message}`, 500)
      };
    }

    const session = sessions && sessions.length > 0 ? sessions[0] : null;
    return { session, error: false };
  } catch (error) {
    console.error('❌ Unexpected error fetching GP51 sessions:', error);
    return { 
      session: null, 
      error: true, 
      response: errorResponse('Failed to fetch GP51 session', 500)
    };
  }
}

export async function validateGp51Session(session: any) {
  if (!session) {
    return { valid: false, reason: 'No session found' };
  }

  const expiresAt = new Date(session.token_expires_at);
  const now = new Date();

  if (expiresAt <= now) {
    return { valid: false, reason: 'Session expired' };
  }

  return { valid: true };
}
