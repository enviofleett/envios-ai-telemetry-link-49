
import { createErrorResponse, createResponse } from './response-utils.ts';

export interface TokenValidationResult {
  isValid: boolean;
  token?: string;
  error?: string;
  requiresReauth?: boolean;
  shouldCleanup?: boolean;
}

export class GP51TokenValidator {
  static validateTokenResponse(responseData: any): TokenValidationResult {
    console.log('🔍 [TOKEN-VALIDATOR] Validating GP51 token response:', {
      status: responseData?.status,
      hasToken: !!responseData?.token,
      tokenLength: responseData?.token?.length || 0,
      responseType: typeof responseData
    });

    // Check if response exists and has required structure
    if (!responseData || typeof responseData !== 'object') {
      console.error('❌ [TOKEN-VALIDATOR] Invalid response structure:', responseData);
      return {
        isValid: false,
        error: 'Invalid or missing response from GP51 API',
        requiresReauth: true,
        shouldCleanup: true
      };
    }

    // GP51 API returns status=0 for success, status=1 for failure
    if (responseData.status !== 0) {
      console.error('❌ [TOKEN-VALIDATOR] GP51 API returned error status:', {
        status: responseData.status,
        message: responseData.message || responseData.cause,
        response: responseData
      });
      
      return {
        isValid: false,
        error: responseData.message || responseData.cause || `GP51 API error (status=${responseData.status})`,
        requiresReauth: true,
        shouldCleanup: true
      };
    }

    // Check if token is present and valid
    if (!responseData.token || typeof responseData.token !== 'string') {
      console.error('❌ [TOKEN-VALIDATOR] Invalid or missing token in response:', {
        hasToken: !!responseData.token,
        tokenType: typeof responseData.token,
        tokenValue: responseData.token
      });
      
      return {
        isValid: false,
        error: 'No valid token received from GP51 API',
        requiresReauth: true,
        shouldCleanup: true
      };
    }

    // Basic token format validation (should be a non-empty string)
    const trimmedToken = responseData.token.trim();
    if (trimmedToken.length < 10) {
      console.error('❌ [TOKEN-VALIDATOR] Token too short or invalid format:', {
        tokenLength: trimmedToken.length,
        token: trimmedToken
      });
      
      return {
        isValid: false,
        error: 'Received invalid token format from GP51',
        requiresReauth: true,
        shouldCleanup: true
      };
    }

    console.log('✅ [TOKEN-VALIDATOR] Token validation passed successfully');
    return {
      isValid: true,
      token: trimmedToken
    };
  }

  static async cleanupInvalidSessions(supabase: any, userId?: string): Promise<void> {
    try {
      console.log('🧹 [TOKEN-VALIDATOR] Starting comprehensive session cleanup...');
      
      let query = supabase
        .from('gp51_sessions')
        .update({
          is_active: false,
          gp51_token: null,
          updated_at: new Date().toISOString()
        });

      // If userId provided, clean only that user's sessions, otherwise clean all invalid sessions
      if (userId) {
        query = query.eq('envio_user_id', userId);
        console.log('🧹 [TOKEN-VALIDATOR] Cleaning sessions for user:', userId);
      } else {
        // Clean sessions that are clearly invalid
        query = query.or('gp51_token.is.null,token_expires_at.lt.' + new Date().toISOString());
        console.log('🧹 [TOKEN-VALIDATOR] Cleaning all expired/invalid sessions');
      }

      const { error, count } = await query.select('id', { count: 'exact' });

      if (error) {
        console.error('❌ [TOKEN-VALIDATOR] Failed to cleanup sessions:', error);
      } else {
        console.log(`✅ [TOKEN-VALIDATOR] Successfully cleaned ${count || 0} invalid sessions`);
      }
    } catch (error) {
      console.error('❌ [TOKEN-VALIDATOR] Cleanup error:', error);
    }
  }

  static createReauthResponse(message: string, sessionId?: string): Response {
    console.log('🔄 [TOKEN-VALIDATOR] Creating re-authentication response:', message);
    
    return createErrorResponse(
      'Authentication required',
      message,
      401,
      undefined,
      {
        requiresReauth: true,
        sessionId,
        action: 'redirect_to_settings',
        userMessage: 'Please re-authenticate with your GP51 credentials in Settings.'
      }
    );
  }

  static async validateStoredSession(supabase: any, sessionId: string): Promise<boolean> {
    try {
      console.log('🔍 [TOKEN-VALIDATOR] Validating stored session:', sessionId);
      
      const { data: session, error } = await supabase
        .from('gp51_sessions')
        .select('gp51_token, token_expires_at, is_active')
        .eq('id', sessionId)
        .single();

      if (error || !session) {
        console.error('❌ [TOKEN-VALIDATOR] Session not found:', sessionId);
        return false;
      }

      // Check if session is active
      if (!session.is_active) {
        console.error('❌ [TOKEN-VALIDATOR] Session is inactive:', sessionId);
        return false;
      }

      // Check if token exists
      if (!session.gp51_token) {
        console.error('❌ [TOKEN-VALIDATOR] Session has no token:', sessionId);
        return false;
      }

      // Check if token has expired
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();
      if (expiresAt <= now) {
        console.error('❌ [TOKEN-VALIDATOR] Session token has expired:', {
          sessionId,
          expiresAt: expiresAt.toISOString(),
          now: now.toISOString()
        });
        return false;
      }

      console.log('✅ [TOKEN-VALIDATOR] Stored session is valid');
      return true;
    } catch (error) {
      console.error('❌ [TOKEN-VALIDATOR] Error validating stored session:', error);
      return false;
    }
  }
}
