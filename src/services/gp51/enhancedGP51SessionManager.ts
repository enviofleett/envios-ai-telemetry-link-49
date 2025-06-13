
import { supabase } from '@/integrations/supabase/client';
import { gp51ApiService } from './gp51ApiService';
import { crossBrowserMD5 } from '@/utils/crossBrowserMD5';

interface GP51SessionData {
  token: string;
  username: string;
  passwordHash: string;
  apiUrl: string;
  expiresAt: Date;
}

export class EnhancedGP51SessionManager {
  private static instance: EnhancedGP51SessionManager;
  private sessionData: GP51SessionData | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): EnhancedGP51SessionManager {
    if (!EnhancedGP51SessionManager.instance) {
      EnhancedGP51SessionManager.instance = new EnhancedGP51SessionManager();
    }
    return EnhancedGP51SessionManager.instance;
  }

  async authenticateAndPersist(username: string, password: string, apiUrl?: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Starting GP51 authentication and persistence...');
      
      // Hash the password for storage
      const passwordHash = await crossBrowserMD5(password);
      
      // Authenticate with GP51
      const authResult = await gp51ApiService.authenticate(username, password);
      
      if (!authResult.success || !authResult.token) {
        return { success: false, error: authResult.error };
      }

      // Create session data
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 23); // GP51 tokens typically last 24 hours

      this.sessionData = {
        token: authResult.token,
        username,
        passwordHash,
        apiUrl: apiUrl || 'https://www.gps51.com',
        expiresAt
      };

      // Persist to Supabase
      await this.persistSessionToDatabase();

      // Set up auto-refresh
      this.scheduleTokenRefresh();

      console.log('GP51 session authenticated and persisted successfully');
      return { success: true };

    } catch (error) {
      console.error('Failed to authenticate and persist GP51 session:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      };
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get session from database
      const { data, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('envio_user_id', user.id)
        .single();

      if (error || !data || !data.gp51_token) {
        console.log('No valid GP51 session found in database');
        return false;
      }

      // Check if token is still valid
      const expiresAt = new Date(data.token_expires_at);
      if (expiresAt <= new Date()) {
        console.log('GP51 token has expired');
        await this.clearSession();
        return false;
      }

      // Restore session data
      this.sessionData = {
        token: data.gp51_token,
        username: data.username,
        passwordHash: data.password_hash,
        apiUrl: data.api_url || 'https://www.gps51.com',
        expiresAt
      };

      // Schedule refresh
      this.scheduleTokenRefresh();

      console.log('GP51 session restored successfully');
      return true;

    } catch (error) {
      console.error('Failed to restore GP51 session:', error);
      return false;
    }
  }

  private async persistSessionToDatabase(): Promise<void> {
    if (!this.sessionData) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('gp51_sessions')
      .upsert({
        envio_user_id: user.id,
        username: this.sessionData.username,
        password_hash: this.sessionData.passwordHash, // Include password_hash
        gp51_token: this.sessionData.token,
        api_url: this.sessionData.apiUrl,
        token_expires_at: this.sessionData.expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to persist session: ${error.message}`);
    }
  }

  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.sessionData) return;

    // Refresh 1 hour before expiration
    const refreshTime = this.sessionData.expiresAt.getTime() - Date.now() - (60 * 60 * 1000);
    
    if (refreshTime > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshToken();
      }, refreshTime);
    }
  }

  private async refreshToken(): Promise<void> {
    if (!this.sessionData) return;

    try {
      console.log('Refreshing GP51 token...');
      
      // Re-authenticate to get a new token
      const authResult = await gp51ApiService.authenticate(
        this.sessionData.username, 
        '' // We don't store raw passwords
      );

      if (authResult.success && authResult.token) {
        this.sessionData.token = authResult.token;
        this.sessionData.expiresAt = new Date();
        this.sessionData.expiresAt.setHours(this.sessionData.expiresAt.getHours() + 23);

        await this.persistSessionToDatabase();
        this.scheduleTokenRefresh();
        
        console.log('GP51 token refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to refresh GP51 token:', error);
      await this.clearSession();
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

      this.sessionData = null;
      
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      console.log('GP51 session cleared');
    } catch (error) {
      console.error('Failed to clear GP51 session:', error);
    }
  }

  getToken(): string | null {
    return this.sessionData?.token || null;
  }

  isSessionValid(): boolean {
    if (!this.sessionData) return false;
    return this.sessionData.expiresAt > new Date();
  }

  getSessionInfo(): GP51SessionData | null {
    return this.sessionData;
  }
}

export const enhancedGP51SessionManager = EnhancedGP51SessionManager.getInstance();
