
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
      tokenLength: responseData?.token?.length || 0
    });

    // GP51 API returns status=0 for success, status=1 for failure
    if (responseData?.status !== 0) {
      console.error('❌ [TOKEN-VALIDATOR] GP51 API returned error status:', responseData?.status);
      
      return {
        isValid: false,
        error: `GP51 API error (status=${responseData?.status})`,
        requiresReauth: true,
        shouldCleanup: true
      };
    }

    // Check if token is present and valid
    if (!responseData?.token || typeof responseData.token !== 'string') {
      console.error('❌ [TOKEN-VALIDATOR] Invalid or missing token in response');
      
      return {
        isValid: false,
        error: 'No valid token received from GP51',
        requiresReauth: true,
        shouldCleanup: true
      };
    }

    // Basic token format validation (should be a non-empty string)
    if (responseData.token.trim().length < 10) {
      console.error('❌ [TOKEN-VALIDATOR] Token too short or invalid format');
      
      return {
        isValid: false,
        error: 'Received invalid token format from GP51',
        requiresReauth: true,
        shouldCleanup: true
      };
    }

    console.log('✅ [TOKEN-VALIDATOR] Token validation passed');
    return {
      isValid: true,
      token: responseData.token.trim()
    };
  }

  static async cleanupInvalidSession(supabase: any, sessionId: string): Promise<void> {
    try {
      console.log('🧹 [TOKEN-VALIDATOR] Cleaning up invalid session:', sessionId);
      
      // Mark session as inactive instead of deleting to preserve audit trail
      const { error } = await supabase
        .from('gp51_sessions')
        .update({
          is_active: false,
          gp51_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) {
        console.error('❌ [TOKEN-VALIDATOR] Failed to cleanup session:', error);
      } else {
        console.log('✅ [TOKEN-VALIDATOR] Session marked as inactive');
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
        action: 'redirect_to_settings'
      }
    );
  }
}
