
import { supabase } from '@/integrations/supabase/client';

export interface AuthResult {
  success: boolean;
  token?: string;
  username?: string;
  error?: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
}

class GP51AuthService {
  private static readonly TOKEN_STORAGE_KEY = 'gp51_token';
  private static readonly USERNAME_STORAGE_KEY = 'gp51_username';
  private static readonly EXPIRES_STORAGE_KEY = 'gp51_expires';

  async login(username: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 Starting GP51 authentication...');

      // Call our edge function to handle GP51 authentication
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'authenticate',
          username: username,
          password: password
        }
      });

      if (error) {
        console.error('❌ GP51 authentication error:', error);
        return {
          success: false,
          error: error.message || 'Authentication failed'
        };
      }

      if (data?.success && data?.token) {
        console.log('✅ GP51 authentication successful');
        
        // Store session information
        const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours
        this.storeTokenInfo(data.token, username, expiresAt);

        // Store in database for persistence
        await this.persistSessionToDatabase(username, data.token, expiresAt);

        return {
          success: true,
          token: data.token,
          username: username
        };
      }

      return {
        success: false,
        error: data?.error || 'Invalid credentials'
      };

    } catch (error) {
      console.error('❌ GP51 authentication exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      // Clear local storage
      this.clearTokenInfo();
      
      // Clear database session
      await this.clearDatabaseSession();

      return { success: true };
    } catch (error) {
      console.error('❌ GP51 logout error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  getAuthStatus(): AuthStatus {
    const token = localStorage.getItem(this.TOKEN_STORAGE_KEY);
    const username = localStorage.getItem(this.USERNAME_STORAGE_KEY);
    const expires = localStorage.getItem(this.EXPIRES_STORAGE_KEY);

    if (!token || !username || !expires) {
      return { isAuthenticated: false };
    }

    const expiresAt = new Date(expires);
    const isExpired = expiresAt <= new Date();

    if (isExpired) {
      this.clearTokenInfo();
      return { isAuthenticated: false };
    }

    return {
      isAuthenticated: true,
      username,
      tokenExpiresAt: expiresAt
    };
  }

  async getToken(): Promise<string | null> {
    const status = this.getAuthStatus();
    
    if (!status.isAuthenticated) {
      // Try to restore from database
      const restored = await this.restoreSessionFromDatabase();
      if (restored) {
        return localStorage.getItem(this.TOKEN_STORAGE_KEY);
      }
      return null;
    }

    return localStorage.getItem(this.TOKEN_STORAGE_KEY);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: {
          action: 'validate_token',
          token: token
        }
      });

      return !error && data?.success === true;
    } catch (error) {
      console.error('❌ GP51 health check failed:', error);
      return false;
    }
  }

  private storeTokenInfo(token: string, username: string, expiresAt: Date): void {
    localStorage.setItem(this.TOKEN_STORAGE_KEY, token);
    localStorage.setItem(this.USERNAME_STORAGE_KEY, username);
    localStorage.setItem(this.EXPIRES_STORAGE_KEY, expiresAt.toISOString());
  }

  private clearTokenInfo(): void {
    localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    localStorage.removeItem(this.USERNAME_STORAGE_KEY);
    localStorage.removeItem(this.EXPIRES_STORAGE_KEY);
  }

  private async persistSessionToDatabase(username: string, token: string, expiresAt: Date): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get or create envio user
      let { data: envioUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!envioUser) {
        const { data: newEnvioUser } = await supabase
          .from('envio_users')
          .insert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || 'Admin User'
          })
          .select('id')
          .single();
        envioUser = newEnvioUser;
      }

      if (envioUser) {
        await supabase
          .from('gp51_sessions')
          .upsert({
            envio_user_id: envioUser.id,
            username: username,
            gp51_token: token,
            token_expires_at: expiresAt.toISOString(),
            api_url: 'https://www.gps51.com/webapi',
            session_metadata: {
              created_via: 'auth_service',
              browser: navigator.userAgent
            }
          });
      }
    } catch (error) {
      console.error('❌ Failed to persist GP51 session:', error);
    }
  }

  private async clearDatabaseSession(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: envioUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (envioUser) {
        await supabase
          .from('gp51_sessions')
          .delete()
          .eq('envio_user_id', envioUser.id);
      }
    } catch (error) {
      console.error('❌ Failed to clear GP51 session:', error);
    }
  }

  private async restoreSessionFromDatabase(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data: envioUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!envioUser) return false;

      const { data: session } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('envio_user_id', envioUser.id)
        .single();

      if (!session || !session.gp51_token) return false;

      const expiresAt = new Date(session.token_expires_at);
      if (expiresAt <= new Date()) {
        // Session expired, clean it up
        await supabase
          .from('gp51_sessions')
          .delete()
          .eq('envio_user_id', envioUser.id);
        return false;
      }

      // Restore to local storage
      this.storeTokenInfo(session.gp51_token, session.username, expiresAt);
      return true;
    } catch (error) {
      console.error('❌ Failed to restore GP51 session:', error);
      return false;
    }
  }
}

export const gps51AuthService = new GP51AuthService();
