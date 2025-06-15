
import { supabase } from '@/integrations/supabase/client';

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

  private constructor() {
    this.restoreSession();
  }

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
        await this.restoreSession(); // Refresh local session state from DB
      } else {
        console.error('❌ GP51 login failed:', result.error);
        this.currentSession = null;
      }
      
      return result;
    } catch (error) {
      console.error('❌ GP51 login exception:', error);
      this.currentSession = null;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  private async authenticate(credentials: GP51Credentials): Promise<AuthResult> {
    try {
      console.log('Authenticating with gp51-auth-service...');
      
      const { data, error: functionError } = await supabase.functions.invoke('gp51-auth-service', {
        body: {
          action: 'test_authentication',
          username: credentials.username,
          password: credentials.password
        }
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Authentication failed on the service-side');
      }
      
      console.log('✅ gp51-auth-service reports success.', data);
      
      return { success: true, token: data.token };

    } catch (error) {
      console.error('❌ GP51 authentication process failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
      return { success: false, error: errorMessage };
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
    await this.restoreSession(); // Always make sure session is fresh
    if (this.currentSession && new Date(this.currentSession.token_expires_at) > new Date()) {
      return this.currentSession.gp51_token;
    }
    return null;
  }

  getAuthStatus(): AuthStatus {
    if (this.currentSession && this.currentSession.token_expires_at && new Date(this.currentSession.token_expires_at) > new Date()) {
      return {
        isAuthenticated: true,
        username: this.currentSession.username,
        tokenExpiresAt: new Date(this.currentSession.token_expires_at)
      };
    }
    return { isAuthenticated: false };
  }

  async restoreSession(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('DB error restoring session:', error);
        this.currentSession = null;
        return;
      };
      
      if (data && data.token_expires_at && new Date(data.token_expires_at) > new Date()) {
        this.currentSession = data;
        console.log(`✅ GP51 Session restored for user: ${data.username}`);
      } else {
        if(data) {
            console.log('Found session but it is expired.');
        } else {
            console.log('No valid GP51 session found in database.');
        }
        this.currentSession = null;
      }
    } catch (error) {
      console.error('❌ Failed to restore GP51 session:', error);
      this.currentSession = null;
    }
  }

  private async clearSession(): Promise<void> {
    try {
      console.log('Clearing all GP51 sessions from database...');
      const { error } = await supabase
        .from('gp51_sessions')
        .delete()
        .neq('username', 'placeholder_for_no_op_delete');

      if (error) {
        throw error;
      }

      this.currentSession = null;
      console.log('All GP51 sessions cleared from database.');
    } catch (error) {
      console.error('Failed to clear sessions:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    await this.restoreSession();
    return this.getAuthStatus().isAuthenticated;
  }
}

export const gps51AuthService = Gps51AuthService.getInstance();
