
import { supabase } from '@/integrations/supabase/client';
import { GP51AuthResponse } from '@/types/gp51-unified';

export class GP51AuthService {
  public session: any = null;
  private currentUser: string | null = null;
  public isAuthenticated: boolean = false;

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      console.log('🔐 Authenticating with GP51...');
      
      const { data, error } = await supabase.functions.invoke('gp51-hybrid-auth', {
        body: { username, password }
      });

      if (error) {
        return {
          success: false,
          status: 'error',
          error: error.message,
          cause: 'Authentication request failed'
        };
      }

      if (!data.success) {
        return {
          success: false,
          status: 'error',
          error: data.error || 'Authentication failed',
          cause: data.details
        };
      }

      // Store session
      this.session = {
        token: data.token,
        username,
        expiresAt: data.expiresAt
      };
      this.currentUser = username;
      this.isAuthenticated = true;

      // Persist session
      localStorage.setItem('gp51_session', JSON.stringify(this.session));

      return {
        success: true,
        status: 'authenticated',
        token: data.token,
        username: username
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message,
        cause: 'Network error'
      };
    }
  }

  async loadExistingSession(): Promise<boolean> {
    try {
      const storedSession = localStorage.getItem('gp51_session');
      if (!storedSession) return false;

      const sessionData = JSON.parse(storedSession);
      
      // Validate session is still active
      const isValid = await this.validateSession(sessionData);
      if (isValid) {
        this.session = sessionData;
        this.isAuthenticated = true;
        this.currentUser = sessionData.username;
        return true;
      }
      
      localStorage.removeItem('gp51_session');
      return false;
    } catch (error) {
      console.error('Failed to load existing session:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.session?.token) {
        await supabase.functions.invoke('gp51-service-management', {
          body: { action: 'logout' }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.disconnect();
    }
  }

  async disconnect(): Promise<void> {
    this.session = null;
    this.currentUser = null;
    this.isAuthenticated = false;
    localStorage.removeItem('gp51_session');
  }

  private async validateSession(sessionData: any): Promise<boolean> {
    try {
      if (!sessionData?.expiresAt) return false;
      
      const expiry = new Date(sessionData.expiresAt);
      if (expiry <= new Date()) return false;

      return true;
    } catch {
      return false;
    }
  }
}
