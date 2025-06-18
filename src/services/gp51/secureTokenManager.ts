
import { supabase } from '@/integrations/supabase/client';

interface SecureTokenData {
  token: string;
  username: string;
  expiresAt: Date;
  isValid: boolean;
}

export class SecureTokenManager {
  private static instance: SecureTokenManager;
  private tokenCache: Map<string, SecureTokenData> = new Map();

  static getInstance(): SecureTokenManager {
    if (!SecureTokenManager.instance) {
      SecureTokenManager.instance = new SecureTokenManager();
    }
    return SecureTokenManager.instance;
  }

  async getSecureToken(): Promise<{ token: string; username: string } | null> {
    try {
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('gp51_token, username, token_expires_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !sessions || sessions.length === 0) {
        console.log('🔐 No GP51 session found');
        return null;
      }

      const session = sessions[0];
      const expiresAt = new Date(session.token_expires_at);
      
      if (expiresAt <= new Date()) {
        console.log('🔐 GP51 token expired, attempting refresh...');
        return await this.refreshToken(session.username);
      }

      // Log token status without exposing the actual token
      console.log('🔐 GP51 token retrieved successfully', {
        username: session.username,
        hasToken: !!session.gp51_token,
        tokenLength: session.gp51_token?.length || 0,
        expiresAt: expiresAt.toISOString(),
        isValid: expiresAt > new Date()
      });

      return {
        token: session.gp51_token,
        username: session.username
      };
    } catch (error) {
      console.error('🔐 Error retrieving secure token:', error);
      return null;
    }
  }

  private async refreshToken(username: string): Promise<{ token: string; username: string } | null> {
    try {
      console.log('🔄 Attempting automatic token refresh for username:', username);
      
      // Try to get stored credentials
      const { data: credentials, error } = await supabase
        .rpc('get_gp51_credentials');

      if (error || !credentials || credentials.length === 0) {
        console.log('🔄 No stored credentials found for refresh');
        return null;
      }

      const credential = credentials[0];
      
      // Re-authenticate with GP51
      const refreshResult = await this.performTokenRefresh(credential.username, credential.password);
      
      if (refreshResult.success) {
        console.log('✅ Token refresh successful');
        return {
          token: refreshResult.token,
          username: credential.username
        };
      } else {
        console.error('❌ Token refresh failed:', refreshResult.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Token refresh exception:', error);
      return null;
    }
  }

  private async performTokenRefresh(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'refresh_token',
          username,
          password
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Token refresh failed' 
      };
    }
  }

  validateTokenFormat(token: string): boolean {
    return token && typeof token === 'string' && token.length >= 8;
  }
}

export const secureTokenManager = SecureTokenManager.getInstance();
