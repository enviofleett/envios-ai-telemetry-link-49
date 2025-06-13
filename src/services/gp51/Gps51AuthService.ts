
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

  async authenticate(credentials: GP51Credentials): Promise<AuthResult> {
    try {
      console.log('🔐 Starting GP51 authentication process...');
      
      // Hash the password using our cross-browser MD5 utility
      const hashedPassword = await crossBrowserMD5(credentials.password);
      console.log('✅ Password hashed successfully');

      // Store session in database with hashed password
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Calculate token expiration (8 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      const { data: sessionData, error: sessionError } = await supabase
        .from('gp51_sessions')
        .upsert({
          envio_user_id: user.id,
          username: credentials.username,
          password_hash: hashedPassword, // Store the hashed password
          gp51_token: `temp_token_${Date.now()}`, // Temporary token
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
      
      // Use the settings-management edge function for testing
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

export const gp51AuthService = Gps51AuthService.getInstance();
