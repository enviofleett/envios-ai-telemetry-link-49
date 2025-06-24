
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { jsonResponse, errorResponse } from './response_utils.ts';
import { getGP51ApiUrl } from './constants.ts';
import { md5_for_gp51_only } from './crypto_utils.ts';

// Database interfaces
export interface GP51Session {
  id: string;
  envio_user_id: string;
  username: string;
  gp51_token: string | any;
  token_expires_at: string;
  api_url: string;
  is_active: boolean;
  created_at: string;
  last_activity_at: string;
  last_validated_at?: string;
}

export interface GP51Credentials {
  username: string;
  password: string;
  api_url?: string;
}

// Authentication result interface
export interface GP51AuthResult {
  success: boolean;
  token?: string;
  username?: string;
  apiUrl?: string;
  error?: string;
  method?: string;
  hashedPassword?: string;
}

// Create Supabase client for database operations
function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Authenticates with GP51 API using provided credentials
 */
async function authenticateWithGP51(credentials: GP51Credentials): Promise<GP51AuthResult> {
  const { username, password, apiUrl = 'https://www.gps51.com' } = credentials;
  
  console.log(`🔐 [GP51-AUTH] Starting GP51 credential validation for user: ${username}`);
  
  try {
    // Environment check
    const globalToken = Deno.env.get('GP51_GLOBAL_API_TOKEN');
    console.log(`🌐 [GP51-AUTH] Environment check:`);
    console.log(`  - Raw Base URL: ${apiUrl}`);
    console.log(`  - Global token: ${globalToken ? 'SET (length: ' + globalToken.length + ')' : 'NOT SET'}`);
    
    // Generate MD5 hash for password
    console.log(`🔄 [GP51-AUTH] Generating MD5 hash for password`);
    const hashedPassword = await md5_for_gp51_only(password);
    console.log(`🔐 [GP51-AUTH] Password hashed successfully`);
    
    // Construct the API URL with proper query parameters
    const urlParams: Record<string, string> = {};
    if (globalToken) {
      urlParams.token = globalToken;
    }
    
    const url = buildGP51ActionUrl(apiUrl, 'login', urlParams);
    
    console.log(`🔧 [URL] Final constructed URL: "${url}"`);
    
    // Prepare request body with credentials
    const requestBody = {
      username: username.trim(),
      password: hashedPassword,
      from: 'WEB',
      type: 'USER'
    };
    
    console.log(`🔄 [GP51-AUTH] Making HTTP POST request to GP51 API`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'User-Agent': 'FleetIQ/1.0'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000)
    });
    
    console.log(`📊 [HTTP] GP51 Response received: Status ${response.status}`);
    
    const responseText = await response.text();
    console.log(`📊 [HTTP] Response body length: ${responseText.length}`);
    
    if (!response.ok) {
      throw new Error(`GP51 API Error: ${response.status} - ${responseText}`);
    }
    
    if (!responseText || responseText.trim().length === 0) {
      console.error(`❌ [GP51-AUTH] GP51 API returned empty response`);
      throw new Error('GP51 authentication failed: Empty response received. Check credentials or API behavior.');
    }
    
    // Try to parse as JSON first, fallback to treating as plain text token
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log(`📋 [GP51-AUTH] Parsed JSON response:`, responseData);
      
      if (responseData.status === 0 && responseData.token) {
        console.log(`✅ [GP51-AUTH] Authentication successful via JSON response`);
        return {
          success: true,
          token: responseData.token,
          username,
          apiUrl: getGP51ApiUrl(apiUrl),
          method: 'POST_JSON',
          hashedPassword
        };
      } else {
        const errorMsg = responseData.cause || responseData.message || `Authentication failed with status ${responseData.status}`;
        console.error(`❌ [GP51-AUTH] Authentication failed:`, errorMsg);
        return {
          success: false,
          error: errorMsg
        };
      }
    } catch (parseError) {
      // Treat as plain text token
      const token = responseText.trim();
      if (token && token.length > 0 && !token.includes('error') && !token.includes('fail')) {
        console.log(`✅ [GP51-AUTH] Authentication successful via plain text token`);
        return {
          success: true,
          token,
          username,
          apiUrl: getGP51ApiUrl(apiUrl),
          method: 'POST_TEXT',
          hashedPassword
        };
      } else {
        console.error(`❌ [GP51-AUTH] Invalid token response:`, token);
        return {
          success: false,
          error: `Invalid authentication response: ${token}`
        };
      }
    }
    
  } catch (error) {
    console.error(`❌ [GP51-AUTH] Authentication request failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error during authentication'
    };
  }
}

/**
 * Builds a GP51 API URL with proper query parameters
 */
function buildGP51ActionUrl(baseUrl: string, action: string, params: Record<string, string> = {}): string {
  const apiUrl = getGP51ApiUrl(baseUrl);
  const url = new URL(apiUrl);
  url.searchParams.set('action', action);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

/**
 * Enhanced function to get and validate GP51 session with automatic re-authentication
 */
export async function getValidGp51Session(): Promise<{
  session: GP51Session | null;
  errorResponse: Response | null;
}> {
  try {
    console.log('🔍 [SESSION] Getting valid GP51 session...');
    
    const supabase = createSupabaseClient();
    
    // Get the most recent active session
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('❌ [SESSION] Database error:', sessionError);
      return {
        session: null,
        errorResponse: errorResponse('Failed to retrieve session data', 500)
      };
    }

    if (!sessions || sessions.length === 0) {
      console.log('⚠️ [SESSION] No active sessions found');
      return {
        session: null,
        errorResponse: errorResponse('No active GP51 sessions found. Please authenticate first.', 401)
      };
    }

    const session = sessions[0] as GP51Session;
    console.log(`🔍 [SESSION] Found session for user: ${session.username}`);

    // Parse and validate the token
    const { isValid, parsedToken, error: tokenError } = parseAndValidateToken(session.gp51_token);
    
    if (!isValid || !parsedToken) {
      console.error(`❌ [SESSION] Invalid token for session ${session.id}:`, tokenError);
      
      // Attempt re-authentication
      const refreshResult = await attemptSessionRefresh(session);
      if (refreshResult.success && refreshResult.session) {
        return {
          session: refreshResult.session,
          errorResponse: null
        };
      }
      
      return {
        session: null,
        errorResponse: errorResponse(`Invalid session token: ${tokenError}`, 401)
      };
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(session.token_expires_at);
    
    if (expiresAt <= now) {
      console.log(`⏰ [SESSION] Token expired at ${expiresAt}, attempting refresh...`);
      
      const refreshResult = await attemptSessionRefresh(session);
      if (refreshResult.success && refreshResult.session) {
        return {
          session: refreshResult.session,
          errorResponse: null
        };
      }
      
      return {
        session: null,
        errorResponse: errorResponse('Session expired and refresh failed', 401)
      };
    }

    // Update the parsed token in the session object for consistency
    const validSession = {
      ...session,
      gp51_token: parsedToken,
      last_validated_at: now.toISOString()
    };

    // Update last validated timestamp in database
    await supabase
      .from('gp51_sessions')
      .update({ last_validated_at: now.toISOString() })
      .eq('id', session.id);

    console.log(`✅ [SESSION] Session validated successfully for ${session.username}`);
    
    return {
      session: validSession,
      errorResponse: null
    };

  } catch (error) {
    console.error('❌ [SESSION] Critical error in getValidGp51Session:', error);
    return {
      session: null,
      errorResponse: errorResponse(
        `Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      )
    };
  }
}

/**
 * Parses and validates GP51 token from various formats
 */
function parseAndValidateToken(tokenData: any): {
  isValid: boolean;
  parsedToken: string | null;
  error: string | null;
} {
  try {
    console.log('🔍 [TOKEN] Parsing token data:', typeof tokenData);
    
    let token: string | null = null;
    
    // Handle different token formats
    if (typeof tokenData === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(tokenData);
        if (parsed && typeof parsed === 'object') {
          if (parsed.status === 0 && parsed.token) {
            token = parsed.token;
            console.log('✅ [TOKEN] Extracted token from JSON string');
          } else {
            return {
              isValid: false,
              parsedToken: null,
              error: `Invalid JSON token: status=${parsed.status}, has token=${!!parsed.token}`
            };
          }
        } else {
          // Treat as direct token string
          token = tokenData.trim();
          console.log('✅ [TOKEN] Using direct token string');
        }
      } catch {
        // Not JSON, treat as direct token
        token = tokenData.trim();
        console.log('✅ [TOKEN] Using non-JSON token string');
      }
    } else if (typeof tokenData === 'object' && tokenData !== null) {
      // Direct object
      if (tokenData.status === 0 && tokenData.token) {
        token = tokenData.token;
        console.log('✅ [TOKEN] Extracted token from object');
      } else {
        return {
          isValid: false,
          parsedToken: null,
          error: `Invalid token object: status=${tokenData.status}, has token=${!!tokenData.token}`
        };
      }
    } else {
      return {
        isValid: false,
        parsedToken: null,
        error: `Invalid token type: ${typeof tokenData}`
      };
    }
    
    // Validate the extracted token
    if (!token || token.length === 0) {
      return {
        isValid: false,
        parsedToken: null,
        error: 'Token is empty or null'
      };
    }
    
    // Basic token format validation
    if (token.length < 10) {
      return {
        isValid: false,
        parsedToken: null,
        error: `Token too short: ${token.length} characters`
      };
    }
    
    // Check for obvious error patterns
    if (token.toLowerCase().includes('error') || 
        token.toLowerCase().includes('fail') ||
        token.toLowerCase().includes('invalid')) {
      return {
        isValid: false,
        parsedToken: null,
        error: `Token contains error indication: ${token.substring(0, 50)}`
      };
    }
    
    console.log(`✅ [TOKEN] Token validation successful, length: ${token.length}`);
    
    return {
      isValid: true,
      parsedToken: token,
      error: null
    };
    
  } catch (error) {
    console.error('❌ [TOKEN] Token parsing failed:', error);
    return {
      isValid: false,
      parsedToken: null,
      error: `Token parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Attempts to refresh a session by re-authenticating with stored credentials
 */
async function attemptSessionRefresh(session: GP51Session): Promise<{
  success: boolean;
  session?: GP51Session;
  error?: string;
}> {
  try {
    console.log(`🔄 [REFRESH] Attempting to refresh session for ${session.username}`);
    
    const supabase = createSupabaseClient();
    
    // Get stored credentials for this user
    const { data: credentials, error: credError } = await supabase
      .from('gp51_secure_credentials')
      .select(`
        username,
        api_url,
        credential_vault_id
      `)
      .eq('user_id', session.envio_user_id)
      .eq('username', session.username)
      .eq('is_active', true)
      .single();

    if (credError || !credentials) {
      console.error('❌ [REFRESH] No stored credentials found:', credError);
      return {
        success: false,
        error: 'No stored credentials available for re-authentication'
      };
    }

    // Get password from vault
    const { data: vaultData, error: vaultError } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('id', credentials.credential_vault_id)
      .single();

    if (vaultError || !vaultData) {
      console.error('❌ [REFRESH] Failed to retrieve password from vault:', vaultError);
      return {
        success: false,
        error: 'Failed to retrieve stored password'
      };
    }

    // Attempt re-authentication
    const authResult = await authenticateWithGP51({
      username: credentials.username,
      password: vaultData.decrypted_secret,
      apiUrl: credentials.api_url
    });

    if (!authResult.success || !authResult.token) {
      console.error('❌ [REFRESH] Re-authentication failed:', authResult.error);
      return {
        success: false,
        error: authResult.error || 'Re-authentication failed'
      };
    }

    // Update session with new token
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours from now

    const { data: updatedSession, error: updateError } = await supabase
      .from('gp51_sessions')
      .update({
        gp51_token: authResult.token,
        token_expires_at: expiresAt.toISOString(),
        last_activity_at: now.toISOString(),
        last_validated_at: now.toISOString()
      })
      .eq('id', session.id)
      .select()
      .single();

    if (updateError || !updatedSession) {
      console.error('❌ [REFRESH] Failed to update session:', updateError);
      return {
        success: false,
        error: 'Failed to update session with new token'
      };
    }

    console.log(`✅ [REFRESH] Session refreshed successfully for ${session.username}`);
    
    return {
      success: true,
      session: updatedSession as GP51Session
    };

  } catch (error) {
    console.error('❌ [REFRESH] Session refresh failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown refresh error'
    };
  }
}

/**
 * Monitors session health and provides recommendations
 */
export async function monitorSessionHealth(): Promise<any> {
  try {
    console.log('📊 [HEALTH] Monitoring GP51 session health...');
    
    const supabase = createSupabaseClient();
    
    // Get all sessions
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('is_active', true);

    if (sessionError) {
      console.error('❌ [HEALTH] Failed to fetch sessions:', sessionError);
      throw new Error('Failed to fetch session data');
    }

    const totalSessions = sessions?.length || 0;
    let validSessions = 0;
    let expiredSessions = 0;
    let invalidTokens = 0;

    const now = new Date();

    if (sessions) {
      for (const session of sessions) {
        const { isValid } = parseAndValidateToken(session.gp51_token);
        const expiresAt = new Date(session.token_expires_at);
        
        if (!isValid) {
          invalidTokens++;
        } else if (expiresAt <= now) {
          expiredSessions++;
        } else {
          validSessions++;
        }
      }
    }

    const healthReport = {
      totalSessions,
      validSessions,
      expiredSessions,
      invalidTokens,
      lastChecked: now.toISOString()
    };

    console.log('✅ [HEALTH] Session health check completed:', healthReport);
    
    return healthReport;

  } catch (error) {
    console.error('❌ [HEALTH] Session health monitoring failed:', error);
    throw error;
  }
}
