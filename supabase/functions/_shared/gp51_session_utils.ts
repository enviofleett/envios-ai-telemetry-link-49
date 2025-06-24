
import { getSupabaseClient } from "./supabase_client.ts";
import { createErrorResponse } from "./response_utils.ts";
import { authenticateWithGP51 } from "../settings-management/gp51-auth.ts";

export interface GP51Session {
  id: string;
  envio_user_id: string;
  username: string;
  gp51_token: string;
  token_expires_at: string;
  created_at: string;
  last_validated_at?: string;
  auth_method?: string;
  api_url?: string;
}

export interface SessionValidationResult {
  session: GP51Session | null;
  errorResponse: Response | null;
}

export interface GP51Credentials {
  username: string;
  password_hash: string;
  api_url?: string;
}

// Token validation and parsing utilities
function parseGP51Token(tokenData: any): string | null {
  console.log('🔍 [GP51SessionUtils] Parsing token data:', typeof tokenData);
  
  if (!tokenData) {
    console.log('❌ [GP51SessionUtils] Token data is null or undefined');
    return null;
  }
  
  // If it's already a string, return it directly
  if (typeof tokenData === 'string') {
    console.log('✅ [GP51SessionUtils] Token is already a string');
    return tokenData.trim();
  }
  
  // If it's an object, try to parse it
  if (typeof tokenData === 'object') {
    console.log('🔄 [GP51SessionUtils] Token is an object, parsing...');
    
    // Check if it has a direct token property
    if (tokenData.token && typeof tokenData.token === 'string') {
      console.log('✅ [GP51SessionUtils] Found token property in object');
      return tokenData.token.trim();
    }
    
    // Check if status indicates success
    if (tokenData.status !== undefined && tokenData.status !== 0) {
      console.log('❌ [GP51SessionUtils] Token object has error status:', tokenData.status);
      return null;
    }
    
    // Try to stringify and parse if it looks like JSON
    try {
      const tokenStr = JSON.stringify(tokenData);
      const parsed = JSON.parse(tokenStr);
      if (parsed.token && typeof parsed.token === 'string') {
        console.log('✅ [GP51SessionUtils] Extracted token from JSON object');
        return parsed.token.trim();
      }
    } catch (error) {
      console.log('⚠️ [GP51SessionUtils] Failed to parse token object as JSON:', error);
    }
  }
  
  console.log('❌ [GP51SessionUtils] Could not extract valid token from data');
  return null;
}

function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  const trimmed = token.trim();
  // GP51 tokens should be at least 8 characters and not contain obvious error indicators
  return trimmed.length >= 8 && 
         !trimmed.toLowerCase().includes('error') && 
         !trimmed.toLowerCase().includes('fail') &&
         !trimmed.toLowerCase().includes('null');
}

async function getStoredCredentials(userId: string): Promise<GP51Credentials | null> {
  console.log('🔑 [GP51SessionUtils] Fetching stored credentials for user:', userId);
  
  try {
    const supabase = getSupabaseClient();
    
    // Get credentials from gp51_secure_credentials table
    const { data: credentials, error } = await supabase
      .from('gp51_secure_credentials')
      .select('username, credential_vault_id, api_url')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error || !credentials || credentials.length === 0) {
      console.log('❌ [GP51SessionUtils] No stored credentials found:', error?.message);
      return null;
    }

    const credential = credentials[0];
    
    // Get password from vault
    const { data: vaultData, error: vaultError } = await supabase
      .from('vault.decrypted_secrets')
      .select('decrypted_secret')
      .eq('id', credential.credential_vault_id)
      .single();

    if (vaultError || !vaultData?.decrypted_secret) {
      console.log('❌ [GP51SessionUtils] Failed to retrieve password from vault:', vaultError?.message);
      return null;
    }

    console.log('✅ [GP51SessionUtils] Successfully retrieved stored credentials');
    return {
      username: credential.username,
      password_hash: vaultData.decrypted_secret,
      api_url: credential.api_url || 'https://www.gps51.com'
    };
  } catch (error) {
    console.error('❌ [GP51SessionUtils] Error fetching stored credentials:', error);
    return null;
  }
}

async function performReAuthentication(userId: string): Promise<{ success: boolean; token?: string; error?: string }> {
  console.log('🔄 [GP51SessionUtils] Starting re-authentication for user:', userId);
  
  try {
    const credentials = await getStoredCredentials(userId);
    if (!credentials) {
      return { success: false, error: 'No stored credentials found for re-authentication' };
    }

    console.log('🔐 [GP51SessionUtils] Re-authenticating with GP51...');
    const authResult = await authenticateWithGP51({
      username: credentials.username,
      password: credentials.password_hash,
      apiUrl: credentials.api_url
    });

    if (!authResult.success || !authResult.token) {
      console.log('❌ [GP51SessionUtils] Re-authentication failed:', authResult.error);
      return { success: false, error: authResult.error || 'Re-authentication failed' };
    }

    console.log('✅ [GP51SessionUtils] Re-authentication successful');
    return { success: true, token: authResult.token };
  } catch (error) {
    console.error('❌ [GP51SessionUtils] Re-authentication error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Re-authentication failed' 
    };
  }
}

async function refreshSessionWithNewToken(sessionId: string, newToken: string): Promise<boolean> {
  console.log('🔄 [GP51SessionUtils] Updating session with new token:', sessionId);
  
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('gp51_sessions')
      .update({
        gp51_token: newToken,
        token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        last_validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ [GP51SessionUtils] Failed to update session:', error);
      return false;
    }

    console.log('✅ [GP51SessionUtils] Session updated with new token');
    return true;
  } catch (error) {
    console.error('❌ [GP51SessionUtils] Error updating session:', error);
    return false;
  }
}

export async function getValidGp51Session(): Promise<SessionValidationResult> {
  console.log('🔍 [GP51SessionUtils] Validating GP51 session...');
  
  try {
    const supabase = getSupabaseClient();

    // Get the most recent active session
    const { data: sessions, error: sessionError } = await supabase
      .from('gp51_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) {
      console.error('❌ [GP51SessionUtils] Database error:', sessionError);
      return {
        session: null,
        errorResponse: createErrorResponse(
          'Failed to retrieve GP51 session',
          sessionError.message,
          500
        )
      };
    }

    if (!sessions || sessions.length === 0) {
      console.log('📝 [GP51SessionUtils] No GP51 sessions found');
      return {
        session: null,
        errorResponse: createErrorResponse(
          'No GP51 configuration found',
          'Please authenticate with GP51 first',
          401
        )
      };
    }

    const session = sessions[0] as GP51Session;
    console.log('🔍 [GP51SessionUtils] Found session:', {
      id: session.id,
      username: session.username,
      userId: session.envio_user_id,
      expiresAt: session.token_expires_at
    });

    // Parse and validate the token
    const parsedToken = parseGP51Token(session.gp51_token);
    if (!parsedToken || !isValidTokenFormat(parsedToken)) {
      console.log('❌ [GP51SessionUtils] Invalid token format, attempting re-authentication');
      
      // Attempt re-authentication
      const reAuthResult = await performReAuthentication(session.envio_user_id);
      if (reAuthResult.success && reAuthResult.token) {
        // Update session with new token
        const updateSuccess = await refreshSessionWithNewToken(session.id, reAuthResult.token);
        if (updateSuccess) {
          // Return updated session
          const updatedSession = {
            ...session,
            gp51_token: reAuthResult.token,
            token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            last_validated_at: new Date().toISOString()
          };
          
          console.log('✅ [GP51SessionUtils] Session refreshed with new token');
          return { session: updatedSession, errorResponse: null };
        }
      }
      
      return {
        session: null,
        errorResponse: createErrorResponse(
          'Invalid GP51 token',
          reAuthResult.error || 'Token is invalid and re-authentication failed',
          401
        )
      };
    }

    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(session.token_expires_at);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    if (expiresAt <= now) {
      console.log('⏰ [GP51SessionUtils] Session expired, attempting refresh');
      
      // Attempt re-authentication for expired session
      const reAuthResult = await performReAuthentication(session.envio_user_id);
      if (reAuthResult.success && reAuthResult.token) {
        const updateSuccess = await refreshSessionWithNewToken(session.id, reAuthResult.token);
        if (updateSuccess) {
          const refreshedSession = {
            ...session,
            gp51_token: reAuthResult.token,
            token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            last_validated_at: new Date().toISOString()
          };
          
          console.log('✅ [GP51SessionUtils] Expired session refreshed');
          return { session: refreshedSession, errorResponse: null };
        }
      }
      
      return {
        session: null,
        errorResponse: createErrorResponse(
          'GP51 session expired',
          reAuthResult.error || 'Session expired and refresh failed',
          401
        )
      };
    }

    // Check if session is near expiry (within 2 hours) and proactively refresh
    const twoHoursInMs = 2 * 60 * 60 * 1000;
    if (timeUntilExpiry <= twoHoursInMs) {
      console.log('⚠️ [GP51SessionUtils] Session expires soon, proactively refreshing');
      
      // Attempt proactive refresh (non-blocking)
      performReAuthentication(session.envio_user_id).then(reAuthResult => {
        if (reAuthResult.success && reAuthResult.token) {
          refreshSessionWithNewToken(session.id, reAuthResult.token);
        }
      }).catch(error => {
        console.warn('⚠️ [GP51SessionUtils] Proactive refresh failed:', error);
      });
    }

    // Validate required fields
    if (!session.username || !session.envio_user_id) {
      console.error('❌ [GP51SessionUtils] Invalid session data:', {
        hasToken: !!parsedToken,
        hasUsername: !!session.username,
        hasUserId: !!session.envio_user_id
      });
      
      return {
        session: null,
        errorResponse: createErrorResponse(
          'Invalid GP51 session data',
          'Session is missing required fields',
          400
        )
      };
    }

    // Update last validated timestamp
    updateSessionActivity(session.id);

    const minutesUntilExpiry = Math.round(timeUntilExpiry / (1000 * 60));
    console.log('✅ [GP51SessionUtils] Valid session found:', {
      sessionId: session.id,
      username: session.username,
      userId: session.envio_user_id,
      minutesUntilExpiry,
      authMethod: session.auth_method || 'unknown'
    });

    // Update session with parsed token for consistency
    const validSession = {
      ...session,
      gp51_token: parsedToken
    };

    return {
      session: validSession,
      errorResponse: null
    };

  } catch (error) {
    console.error('❌ [GP51SessionUtils] Session validation failed:', error);
    return {
      session: null,
      errorResponse: createErrorResponse(
        'Session validation failed',
        error instanceof Error ? error.message : 'Unknown error',
        500
      )
    };
  }
}

export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('gp51_sessions')
      .update({
        last_validated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ [GP51SessionUtils] Failed to update session activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ [GP51SessionUtils] Error updating session activity:', error);
    return false;
  }
}

// Health monitoring function
export async function monitorSessionHealth(): Promise<{
  totalSessions: number;
  validSessions: number;
  expiredSessions: number;
  invalidTokens: number;
}> {
  console.log('🔍 [GP51SessionUtils] Monitoring session health...');
  
  try {
    const supabase = getSupabaseClient();
    
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('id, gp51_token, token_expires_at');

    if (error || !sessions) {
      console.error('❌ [GP51SessionUtils] Failed to fetch sessions for health check:', error);
      return { totalSessions: 0, validSessions: 0, expiredSessions: 0, invalidTokens: 0 };
    }

    const now = new Date();
    let validSessions = 0;
    let expiredSessions = 0;
    let invalidTokens = 0;

    for (const session of sessions) {
      const parsedToken = parseGP51Token(session.gp51_token);
      
      if (!parsedToken || !isValidTokenFormat(parsedToken)) {
        invalidTokens++;
        continue;
      }

      const expiresAt = new Date(session.token_expires_at);
      if (expiresAt <= now) {
        expiredSessions++;
      } else {
        validSessions++;
      }
    }

    const healthReport = {
      totalSessions: sessions.length,
      validSessions,
      expiredSessions,
      invalidTokens
    };

    console.log('📊 [GP51SessionUtils] Session health report:', healthReport);
    return healthReport;
  } catch (error) {
    console.error('❌ [GP51SessionUtils] Session health monitoring failed:', error);
    return { totalSessions: 0, validSessions: 0, expiredSessions: 0, invalidTokens: 0 };
  }
}
