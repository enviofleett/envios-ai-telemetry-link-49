
import { supabase } from '@/integrations/supabase/client';

interface GP51Session {
  gp51_token: string;
  username: string;
  token_expires_at: string;
}

export class SessionManager {
  async getValidSession(): Promise<GP51Session> {
    const { data: session, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('gp51_token, username, token_expires_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError || !session) {
      throw new Error('No active GP51 session found');
    }

    // Check if token is still valid
    if (new Date(session.token_expires_at) < new Date()) {
      throw new Error('GP51 session token has expired');
    }

    return session;
  }
}
