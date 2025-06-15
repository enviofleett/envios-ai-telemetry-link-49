import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { encrypt, decrypt } from '../_shared/encryption.ts';

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
  // Log received settings, masking password for security
  const loggableSettings = { ...settings };
  if (loggableSettings.smtp_password) loggableSettings.smtp_password = '********';
  console.log('[db-smtp] Received settings for saving:', loggableSettings);
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { id, smtp_host, smtp_port, smtp_user, smtp_password, use_tls, use_ssl, from_name, from_email } = settings;

  console.log('[db-smtp] Validating required fields...');
  const requiredFields = {
    'SMTP Host': smtp_host,
    'SMTP Port': smtp_port,
    'SMTP User': smtp_user,
    'Sender Name': from_name,
    'Sender Email': from_email,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    const errorMsg = `Missing required SMTP fields: ${missingFields.join(', ')}.`;
    console.error(`[db-smtp] Validation failed: ${errorMsg}`);
    throw new Error(errorMsg);
  }
  console.log('[db-smtp] All required fields are present.');
  
  let smtp_encryption = 'none';
  if (use_ssl) smtp_encryption = 'ssl';
  else if (use_tls) smtp_encryption = 'tls';

  const upsertData: any = {
    id: id || undefined,
    smtp_host,
    smtp_port,
    smtp_username: smtp_user, // Map UI field to DB column
    smtp_encryption,
    is_active: true,
    updated_at: new Date().toISOString(),
    from_name,
    from_email,
  };

  if (smtp_password) {
    console.log('[db-smtp] SMTP password provided, preparing for encryption...');
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('[db-smtp] CRITICAL: ENCRYPTION_KEY environment variable not set.');
      throw new Error('Server configuration error: ENCRYPTION_KEY is missing.');
    }
    if (new TextEncoder().encode(encryptionKey).length !== 32) {
      console.error(`[db-smtp] CRITICAL: Invalid ENCRYPTION_KEY length. Expected 32 bytes, got ${new TextEncoder().encode(encryptionKey).length}.`);
      throw new Error('Server configuration error: Invalid ENCRYPTION_KEY. It must be a 32-byte string.');
    }
    console.log('[db-smtp] Encryption key found and has valid length. Encrypting password...');
    upsertData.smtp_password_encrypted = await encrypt(smtp_password, encryptionKey);
    console.log('[db-smtp] Password encrypted successfully.');
  } else {
    console.log('[db-smtp] No SMTP password provided, skipping encryption.');
  }

  // Remove undefined properties before upsert to avoid inserting nulls
  Object.keys(upsertData).forEach(key => upsertData[key] === undefined && delete upsertData[key]);
  const finalLoggableData = { ...upsertData };
  if (finalLoggableData.smtp_password_encrypted) finalLoggableData.smtp_password_encrypted = '********';
  console.log('[db-smtp] Final data for upsert:', finalLoggableData);

  const { data, error } = await supabase
    .from('smtp_settings')
    .upsert(upsertData, { onConflict: 'id' }) // Use 'id' for conflict to handle new inserts correctly
    .select()
    .single();

  if (error) {
    console.error('[db-smtp] Supabase upsert error:', error);
    if (error.code === '23502') { // not_null_violation
        throw new Error(`Database error: A required field is missing. Details: ${error.details}`);
    }
    throw new Error(`Failed to save SMTP settings: ${error.message}`);
  }

  console.log('[db-smtp] SMTP settings saved successfully to database. Result ID:', data?.id);
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

export async function saveSmsSettings(settings: any) {
  const loggableSettings = { ...settings };
  if (loggableSettings.password) loggableSettings.password = '********';
  console.log('[db-sms] Received SMS settings for saving:', loggableSettings);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const { username, password, sender, route, userId } = settings;

  const upsertData: any = {
    user_id: userId,
    provider_name: 'mysms', // Hardcoded for now
    username,
    sender_id: sender,
    route: route.toString(),
    is_active: true,
    is_default: true,
    updated_at: new Date().toISOString()
  }

  if (password) {
    console.log('[db-sms] SMS password provided, encrypting...');
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('[db-sms] CRITICAL: ENCRYPTION_KEY environment variable not set.');
      throw new Error('Server configuration error: ENCRYPTION_KEY is missing.');
    }
    upsertData.password_encrypted = await encrypt(password, encryptionKey);
    console.log('[db-sms] Password encrypted successfully.');
  }

  const { data, error } = await supabase
    .from('sms_configurations')
    .upsert(upsertData, { onConflict: 'user_id,provider_name' })
    .select()
    .single();

  if (error) {
    console.error('[db-sms] Supabase upsert error:', error);
    throw new Error(`Failed to save SMS settings: ${error.message}`);
  }
  
  console.log('[db-sms] SMS settings saved successfully to database. Result ID:', data?.id);
  // Don't return encrypted password to client
  if (data) delete data.password_encrypted;
  return data;
}

export async function getSmsSettings(userId: string) {
    console.log('[db-sms] Getting SMS settings for user:', userId);
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data, error } = await supabase
      .from('sms_configurations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
        if (error.code === 'PGRST116') { // No rows found
            return null;
        }
        console.error('[db-sms] Error fetching SMS config:', error);
        throw new Error(`Failed to get SMS configuration: ${error.message}`);
    }

    if (data && data.password_encrypted) {
        const encryptionKey = Deno.env.get('ENCRYPTION_KEY');
        if (!encryptionKey) {
            console.error('[db-sms] CRITICAL: ENCRYPTION_KEY is missing for decryption.');
            throw new Error('Server configuration error: cannot decrypt credentials.');
        }
        data.password = await decrypt(data.password_encrypted, encryptionKey);
        delete data.password_encrypted;
    }
    
    return data;
}

/**
 * Returns paginated SMS logs for a user.
 * @param {string} userId - The user's UUID.
 * @param {number} page - The page number (1-based).
 * @param {number} limit - The number of logs per page.
 * @param {any} [supabase] - Optional Supabase client, or will create new.
 * @returns {Promise<{ success: boolean, data: any[], total: number, page: number, limit: number, error?: string }>}
 */
export async function getSmsLogsPaginated(userId: string, page = 1, limit = 50, supabaseClient?: any) {
  try {
    const supabase = supabaseClient || createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch paginated logs, newest first
    const from = (page - 1) * limit, to = from + limit - 1;
    const { data: logs, error } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    // Get total count
    const { count, error: countError } = await supabase
      .from('sms_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    if (countError) throw countError;

    return {
      success: true,
      data: logs || [],
      total: count || 0,
      page, limit
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      total: 0,
      page, limit,
      error: error.message
    };
  }
}
