
export async function getStoredGP51Credentials(supabase: any): Promise<{
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
}> {
  try {
    console.log('Retrieving stored GP51 credentials...');
    
    // Get the most recent valid GP51 session
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('username, gp51_token, token_expires_at')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Failed to query GP51 sessions:', error);
      return { success: false, error: 'Failed to retrieve stored credentials' };
    }

    if (!sessions || sessions.length === 0) {
      console.log('No GP51 credentials found in database');
      return { success: false, error: 'No GP51 credentials configured. Please set up GP51 connection in Admin Settings.' };
    }

    const session = sessions[0];
    const now = new Date();
    const expiresAt = new Date(session.token_expires_at);

    // Check if token is still valid
    if (session.gp51_token && expiresAt > now) {
      console.log(`Using existing valid token for ${session.username}, expires at ${expiresAt.toISOString()}`);
      return {
        success: true,
        token: session.gp51_token,
        username: session.username
      };
    }

    console.log(`Token for ${session.username} has expired or is missing. Need to re-authenticate.`);
    return { success: false, error: 'Stored GP51 credentials are expired. Please refresh connection in Admin Settings.' };

  } catch (error) {
    console.error('Error retrieving stored GP51 credentials:', error);
    return { success: false, error: 'Error accessing stored credentials' };
  }
}

export async function refreshGP51Token(supabase: any): Promise<{
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
}> {
  // This would require the original password which we don't want to store
  // For now, we'll rely on the admin manually refreshing through settings
  return { 
    success: false, 
    error: 'Token refresh required. Please reconnect in Admin Settings.' 
  };
}
