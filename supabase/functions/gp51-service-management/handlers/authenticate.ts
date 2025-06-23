
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { md5_for_gp51_only } from '../../_shared/crypto_utils.ts';
import { successResponse, errorResponse } from '../response-helpers.ts';

export async function handleAuthenticate(
  supabase: SupabaseClient, 
  username: string, 
  password: string, 
  apiUrl?: string
) {
  try {
    console.log(`🔐 Starting GP51 authentication for username: ${username}`);
    
    // Generate MD5 hash for password
    const hashedPassword = await md5_for_gp51_only(password);
    console.log(`🔐 Password hashed successfully`);
    
    // Construct the API URL
    const baseUrl = apiUrl || 'https://www.gps51.com';
    const endpoint = `${baseUrl.replace(/\/webapi\/?$/, '')}/webapi`;
    
    const url = new URL(endpoint);
    url.searchParams.set('action', 'login');
    
    const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    if (globalToken) {
      url.searchParams.set('token', globalToken);
    }
    
    // Prepare request body
    const requestBody = {
      username: username.trim(),
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    };
    
    console.log(`📡 Making authentication request to GP51...`);
    
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000)
    });
    
    if (!response.ok) {
      throw new Error(`GP51 API Error: ${response.status} - ${await response.text()}`);
    }
    
    const responseText = await response.text();
    
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('GP51 authentication failed: Empty response received');
    }
    
    // Try to parse as JSON first, fallback to plain text
    let token;
    try {
      const responseData = JSON.parse(responseText);
      if (responseData.status === 0 && responseData.token) {
        token = responseData.token;
      } else {
        throw new Error(responseData.cause || `Authentication failed with status ${responseData.status}`);
      }
    } catch (parseError) {
      // Treat as plain text token
      token = responseText.trim();
      if (!token || token.includes('error') || token.includes('fail')) {
        throw new Error(`Invalid authentication response: ${token}`);
      }
    }
    
    // Store session in database
    const { error: insertError } = await supabase
      .from('gp51_sessions')
      .upsert({
        username,
        password_hash: hashedPassword,
        gp51_token: token,
        token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        api_url: endpoint,
        last_activity_at: new Date().toISOString()
      }, {
        onConflict: 'username'
      });

    if (insertError) {
      console.error('❌ Failed to save GP51 session:', insertError);
      throw new Error('Failed to save authentication session');
    }

    console.log('✅ GP51 authentication successful');
    
    return successResponse({
      message: 'GP51 authentication successful',
      username,
      token,
      apiUrl: endpoint
    });

  } catch (error) {
    console.error('❌ GP51 authentication failed:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Authentication failed',
      401
    );
  }
}
