
import { supabase } from '@/integrations/supabase/client';
import { enhancedGP51SessionManager } from '@/services/security/enhancedGP51SessionManager';

export interface GP51AuthCredentials {
  username: string;
  password: string;
  apiUrl?: string;
}

export interface SecureAuthResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  username?: string;
  apiUrl?: string;
  lastValidated?: Date;
  riskLevel?: 'low' | 'medium' | 'high';
}

export class SecureGP51AuthService {
  private static instance: SecureGP51AuthService;

  private constructor() {}

  static getInstance(): SecureGP51AuthService {
    if (!SecureGP51AuthService.instance) {
      SecureGP51AuthService.instance = new SecureGP51AuthService();
    }
    return SecureGP51AuthService.instance;
  }

  async authenticate(username: string, password: string, apiUrl?: string): Promise<SecureAuthResult> {
    try {
      console.log('🔐 Starting secure GP51 authentication...');

      // Call the secure authentication edge function
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: {
          action: 'authenticate',
          username,
          password,
          apiUrl: apiUrl || 'https://www.gps51.com'
        }
      });

      if (error) {
        console.error('❌ Secure auth edge function error:', error);
        return {
          success: false,
          error: error.message || 'Authentication service error',
          errorCode: 'EDGE_FUNCTION_ERROR'
        };
      }

      if (!data.success) {
        console.error('❌ Secure authentication failed:', data.error);
        return {
          success: false,
          error: data.error || 'Authentication failed',
          errorCode: data.errorCode || 'AUTH_FAILED'
        };
      }

      // Create secure session with the received token
      const sessionResult = await enhancedGP51SessionManager.createSecureSession(
        username,
        data.token
      );

      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error || 'Failed to create secure session',
          errorCode: 'SESSION_CREATION_FAILED'
        };
      }

      console.log('✅ Secure authentication completed successfully');

      return {
        success: true
      };

    } catch (error) {
      console.error('❌ Secure authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error',
        errorCode: 'AUTH_ERROR'
      };
    }
  }

  async getAuthStatus(): Promise<AuthStatus> {
    try {
      const session = enhancedGP51SessionManager.getCurrentSession();
      
      if (!session) {
        return {
          isAuthenticated: false
        };
      }

      const validation = await enhancedGP51SessionManager.validateCurrentSession();

      return {
        isAuthenticated: validation.isValid,
        username: session.username,
        lastValidated: new Date(session.lastValidated),
        riskLevel: validation.riskLevel
      };

    } catch (error) {
      console.error('❌ Failed to get auth status:', error);
      return {
        isAuthenticated: false
      };
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🔓 Logging out from secure GP51 session...');
      await enhancedGP51SessionManager.terminateSession();
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }

  async getSecureCredentials(): Promise<GP51AuthCredentials | null> {
    try {
      const session = enhancedGP51SessionManager.getCurrentSession();
      
      if (!session) {
        return null;
      }

      // For security, we don't return the actual credentials
      // This would typically require re-authentication
      return {
        username: session.username,
        password: '[REDACTED]', // Never return actual password
        apiUrl: 'https://www.gps51.com' // Default API URL
      };

    } catch (error) {
      console.error('❌ Failed to get secure credentials:', error);
      return null;
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = await enhancedGP51SessionManager.validateCurrentSession();
      
      if (!validation.isValid) {
        return {
          success: false,
          error: `Session invalid: ${validation.reasons.join(', ')}`
        };
      }

      return {
        success: true
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }
}

// Export singleton instance
export const secureGP51AuthService = SecureGP51AuthService.getInstance();
