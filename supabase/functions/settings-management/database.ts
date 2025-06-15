import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { encrypt } from '../_shared/encryption.ts';

export async function saveGP51Session(username: string, token: string, apiUrl?: string, userId?: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Trim whitespace from username to ensure clean storage
  const trimmedUsername = username.trim();

  // Calculate token expiry (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  try {
    console.log('Saving GP51 session for user:', trimmedUsername, 'with API URL:', apiUrl, 'userId:', userId);
    
    const sessionData: any = {
      username: trimmedUsername,
      gp51_token: token,
      token_expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Always store the API URL - use provided URL or fallback to default
    sessionData.api_url = apiUrl?.trim() || 'https://www.gps51.com';

    // Add user ID if provided for proper linking
    if (userId) {
      sessionData.envio_user_id = userId;
      console.log('Linking session to user ID:', userId);
    } else {
      console.warn('No user ID provided - session will not be linked to a specific user');
    }

    const { data, error } = await supabase
      .from('gp51_sessions')
      .upsert(sessionData, {
        onConflict: 'username'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error saving GP51 session:', error);
      
      // Provide more specific error messages for common issues
      if (error.code === '23505') {
        throw new Error('A session with this username already exists. The existing session has been updated.');
      } else if (error.code === '23503') {
        throw new Error('Invalid user reference. Please ensure you are logged in properly.');
      } else {
        throw new Error(`Failed to save GP51 session: ${error.message}`);
      }
    }

    console.log('GP51 session saved successfully for user:', trimmedUsername, 'ID:', data?.id, 'linked to user:', data?.envio_user_id, 'API URL:', data?.api_url);
    return data;

  } catch (error) {
    console.error('Error in saveGP51Session:', error);
    throw error;
  }
}

export async function saveSmtpSettings(settings: any) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { id, smtp_host, smtp_port, smtp_user, smtp_password, use_tls, use_ssl, provider_name = 'custom' } = settings;

  if (!smtp_host || !smtp_port || !smtp_user) {
    throw new Error("Missing required SMTP fields: host, port, and user are required.");
  }

  const upsertData: any = {
    id: id || undefined,
    smtp_host,
    smtp_port,
    smtp_user,
    use_tls,
    use_ssl,
    provider_name,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  if (smtp_password) {
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY environment variable not set.');
      throw new Error('Server configuration error: encryption key is missing.');
    }
    upsertData.smtp_password_encrypted = await encrypt(smtp_password, encryptionKey);
  }

  const { data, error } = await supabase
    .from('smtp_settings')
    .upsert(upsertData)
    .select()
    .single();

  if (error) {
    console.error('Error saving SMTP settings:', error);
    throw new Error(`Failed to save SMTP settings: ${error.message}`);
  }

  console.log('SMTP settings saved successfully.');
  return data;
}

export async function updateSmtpTestStatus(status: 'success' | 'failure', message: string) {
    const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data, error } = await supabase
    .from('smtp_settings')
    .update({
      last_test_status: status,
      last_test_message: message,
      last_tested_at: new Date().toISOString()
    })
    .eq('is_active', true);

  if (error) {
    console.error('Error updating SMTP test status:', error);
  }

  return { success: !error, data };
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
