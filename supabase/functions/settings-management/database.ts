
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export async function saveGP51Session(username: string, token: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Calculate token expiry (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  try {
    console.log('Saving GP51 session for user:', username);
    
    const { data, error } = await supabase
      .from('gp51_sessions')
      .upsert({
        username: username,
        gp51_token: token,
        token_expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error saving GP51 session:', error);
      throw new Error(`Failed to save GP51 session: ${error.message}`);
    }

    console.log('GP51 session saved successfully:', data?.id);
    return data;

  } catch (error) {
    console.error('Error in saveGP51Session:', error);
    throw error;
  }
}

export async function getGP51Status() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    console.log('Checking GP51 status...');
    
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('username, gp51_token, token_expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Database error fetching GP51 sessions:', error);
      return {
        connected: false,
        error: 'Database error checking GP51 status'
      };
    }

    const sessionsFound = sessions?.length || 0;
    console.log('GP51 status check result:', {
      sessionsFound,
      hasActiveSession: sessions?.[0]?.gp51_token ? sessions[0].gp51_token.substring(0, 32) + '...' : 'none',
      expiresAt: sessions?.[0]?.token_expires_at
    });

    if (!sessions || sessions.length === 0) {
      return {
        connected: false,
        error: 'No GP51 sessions found'
      };
    }

    const latestSession = sessions[0];
    const now = new Date();
    const expiresAt = new Date(latestSession.token_expires_at);

    if (expiresAt <= now) {
      return {
        connected: false,
        username: latestSession.username,
        error: 'GP51 session expired',
        expiresAt: latestSession.token_expires_at
      };
    }

    return {
      connected: true,
      username: latestSession.username,
      expiresAt: latestSession.token_expires_at
    };

  } catch (error) {
    console.error('Error checking GP51 status:', error);
    return {
      connected: false,
      error: 'Failed to check GP51 status'
    };
  }
}
