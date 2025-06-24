
export interface GP51TokenResponse {
  status: number;
  token?: string;
  cause?: string;
  message?: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  recommendations?: string[];
}

export class GP51TokenValidator {
  private static readonly VALID_STATUS_CODE = 0;
  private static readonly MIN_TOKEN_LENGTH = 8;
  private static readonly MAX_TOKEN_LENGTH = 128;

  static validateTokenResponse(response: GP51TokenResponse): TokenValidationResult {
    console.log('🔍 [TOKEN-VALIDATOR] Validating GP51 token response:', {
      status: response.status,
      hasToken: !!response.token,
      tokenLength: response.token?.length || 0,
      responseType: typeof response
    });

    // Check if response status indicates success
    if (response.status !== this.VALID_STATUS_CODE) {
      const error = response.cause || response.message || `Invalid status code: ${response.status}`;
      console.error('❌ [TOKEN-VALIDATOR] Invalid status code:', error);
      return {
        isValid: false,
        error,
        recommendations: [
          'Verify GP51 credentials are correct',
          'Check if GP51 account is active',
          'Ensure API URL is correct'
        ]
      };
    }

    // Check if token exists
    if (!response.token) {
      console.error('❌ [TOKEN-VALIDATOR] No token in response');
      return {
        isValid: false,
        error: 'No authentication token received from GP51',
        recommendations: [
          'Check GP51 server status',
          'Verify authentication request format',
          'Contact GP51 support if issue persists'
        ]
      };
    }

    // Validate token format
    const token = response.token.trim();
    if (token.length < this.MIN_TOKEN_LENGTH || token.length > this.MAX_TOKEN_LENGTH) {
      console.error('❌ [TOKEN-VALIDATOR] Invalid token length:', token.length);
      return {
        isValid: false,
        error: `Invalid token length: ${token.length}. Expected between ${this.MIN_TOKEN_LENGTH} and ${this.MAX_TOKEN_LENGTH} characters`,
        recommendations: [
          'Check GP51 API response format',
          'Verify token is not truncated'
        ]
      };
    }

    // Check for valid token characters (alphanumeric)
    const tokenPattern = /^[a-zA-Z0-9]+$/;
    if (!tokenPattern.test(token)) {
      console.error('❌ [TOKEN-VALIDATOR] Invalid token format');
      return {
        isValid: false,
        error: 'Token contains invalid characters. Expected alphanumeric only.',
        recommendations: [
          'Check GP51 API response encoding',
          'Verify token is not corrupted during transmission'
        ]
      };
    }

    console.log('✅ [TOKEN-VALIDATOR] Token validation passed successfully');
    return {
      isValid: true
    };
  }

  static async cleanupInvalidSessions(adminSupabase: any, userId: string): Promise<void> {
    try {
      console.log('🧹 [TOKEN-VALIDATOR] Cleaning up invalid sessions for user:', userId);
      
      // Mark expired sessions as inactive
      const { error: updateError } = await adminSupabase
        .from('gp51_sessions')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('envio_user_id', userId)
        .lt('token_expires_at', new Date().toISOString());

      if (updateError) {
        console.error('❌ [TOKEN-VALIDATOR] Failed to cleanup sessions:', updateError);
        throw updateError;
      }

      console.log('✅ [TOKEN-VALIDATOR] Invalid sessions cleaned up successfully');
    } catch (error) {
      console.error('❌ [TOKEN-VALIDATOR] Cleanup error:', error);
      throw error;
    }
  }

  static validateStoredToken(token: string, expiresAt: string): TokenValidationResult {
    if (!token || token.trim().length === 0) {
      return {
        isValid: false,
        error: 'Token is empty or missing'
      };
    }

    const expiry = new Date(expiresAt);
    const now = new Date();
    
    if (expiry <= now) {
      return {
        isValid: false,
        error: 'Token has expired',
        recommendations: ['Re-authenticate to get a new token']
      };
    }

    return {
      isValid: true
    };
  }
}
