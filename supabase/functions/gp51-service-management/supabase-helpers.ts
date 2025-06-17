
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface GP51Session {
  id: string;
  username: string;
  password_hash: string;
  gp51_token?: string;
  token_expires_at: string;
  api_url?: string;
  created_at: string;
  last_validated_at?: string;
}

export async function getLatestGp51Session(supabase: SupabaseClient): Promise<{
  session: GP51Session | null;
  error: any;
  response: Response | null;
}> {
  try {
    console.log('🔍 Fetching latest GP51 session from database...');
    
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Database error fetching GP51 session:', error);
      return {
        session: null,
        error: error,
        response: null
      };
    }

    if (!sessions || sessions.length === 0) {
      console.log('📝 No GP51 sessions found in database');
      return {
        session: null,
        error: null,
        response: null
      };
    }

    const session = sessions[0] as GP51Session;
    console.log(`✅ Found GP51 session for user: ${session.username}`);
    
    return {
      session,
      error: null,
      response: null
    };

  } catch (exception) {
    console.error('💥 Exception while fetching GP51 session:', exception);
    return {
      session: null,
      error: exception,
      response: null
    };
  }
}
