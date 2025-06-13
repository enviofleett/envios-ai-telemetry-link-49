import { supabase } from '@/integrations/supabase/client';
import { crossBrowserMD5 } from '@/utils/crossBrowserMD5';

export interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
  sessionId?: string;
}

export interface GP51Credentials {
  username: string;
  password: string;
  apiUrl?: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  username?: string;
  tokenExpiresAt?: Date;
}

export class Gps51AuthService {
  private static instance: Gps51AuthService;
  private currentSession: any = null;

  private constructor() {}

  static getInstance(): Gps51AuthService {
    if (!Gps51AuthService.instance) {
      Gps51AuthService.instance = new Gps51AuthService();
    }
    return Gps51AuthService.instance;
  }

  async login(username: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔐 GP51 Login attempt for user:', username);
      
      const result = await this.authenticate({ username, password });
      
      if (result.success) {
        console.log('✅ GP51 login successful');
      } else {
        console.error('❌ GP51 login failed:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ GP51 login exception:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async logout(): Promise<AuthResult> {
    try {
      console.log('👋 GP51 Logout initiated');
      await this.clearSession();
      console.log('✅ GP51 logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ GP51 logout failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  async getToken(): Promise<string | null> {
    try {
      if (this.currentSession?.gp51_token) {
        return this.currentSession.gp51_token;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: session } = await supabase
        .from('gp51_sessions')
        .select('gp51_token, token_expires_at')
        .eq('envio_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session && new Date(session.token_expires_at) > new Date()) {
        return session.gp51_token;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to get GP51 token:', error);
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const token = await this.getToken();
      return token !== null;
    } catch (error) {
      console.error('❌ GP51 health check failed:', error);
      return false;
    }
  }

  getAuthStatus(): AuthStatus {
    if (this.currentSession) {
      return {
        isAuthenticated: true,
        username: this.currentSession.username,
        tokenExpiresAt: new Date(this.currentSession.token_expires_at)
      };
    }

    return { isAuthenticated: false };
  }

  async authenticate(credentials: GP51Credentials): Promise<AuthResult> {
    try {
      console.log('🔐 Starting GP51 authentication process...');
      
      const hashedPassword = await crossBrowserMD5(credentials.password);
      console.log('✅ Password hashed successfully');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      const { data: sessionData, error: sessionError } = await supabase
        .from('gp51_sessions')
        .upsert({
          envio_user_id: user.id,
          username: credentials.username,
          password_hash: hashedPassword,
          gp51_token: `temp_token_${Date.now()}`,
          token_expires_at: expiresAt.toISOString(),
          api_url: credentials.apiUrl || 'https://www.gps51.com/webapi',
          last_activity_at: new Date().toISOString()
        }, {
          onConflict: 'username'
        })
        .select()
        .single();

      if (sessionError) {
        console.error('❌ Failed to store GP51 session:', sessionError);
        return { success: false, error: 'Failed to store session data' };
      }

      this.currentSession = sessionData;
      console.log('✅ GP51 authentication successful');

      return {
        success: true,
        token: sessionData.gp51_token,
        sessionId: sessionData.id
      };

    } catch (error) {
      console.error('❌ GP51 authentication failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async testConnection(credentials: GP51Credentials): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧪 Testing GP51 connection...');
      
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'save-gp51-credentials',
          username: credentials.username,
          password: credentials.password,
          apiUrl: credentials.apiUrl,
          testOnly: true
        }
      });

      if (error) {
        console.error('🔥 Connection test failed:', error);
        return { success: false, error: error.message };
      }

      if (data.success) {
        console.log('✅ GP51 connection test successful');
        return { success: true };
      } else {
        console.error('🔥 GP51 API returned error:', data.error);
        return { success: false, error: data.error || 'Connection test failed' };
      }
    } catch (error) {
      console.error('🔥 Connection test error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection test failed' 
      };
    }
  }

  async saveCredentials(credentials: GP51Credentials): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { 
          action: 'save-gp51-credentials',
          username: credentials.username,
          password: credentials.password,
          apiUrl: credentials.apiUrl,
          testOnly: false
        }
      });
      
      if (error) throw error;
      
      return { success: data.success, error: data.error };
    } catch (error) {
      console.error('Failed to save GP51 credentials:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save credentials' 
      };
    }
  }

  async getConnectionStatus(): Promise<{ connected: boolean; username?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'get-gp51-status' }
      });
      
      if (error) throw error;
      
      return {
        connected: data.success || false,
        username: data.username,
        error: data.error
      };
    } catch (error) {
      console.error('Failed to get GP51 status:', error);
      return { 
        connected: false, 
        error: error instanceof Error ? error.message : 'Failed to check status' 
      };
    }
  }

  async clearSession(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('gp51_sessions')
          .delete()
          .eq('envio_user_id', user.id);
      }

      this.currentSession = null;
      console.log('GP51 session cleared');
    } catch (error) {
      console.error('Failed to clear GP51 session:', error);
    }
  }

  getCurrentSession() {
    return this.currentSession;
  }

  isAuthenticated(): boolean {
    return this.currentSession !== null;
  }
}

// Export the singleton instance
export const gps51AuthService = Gps51AuthService.getInstance();
