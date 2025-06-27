
import { supabase } from '@/integrations/supabase/client';
import type { GP51AuthResponse } from '@/types/gp51-unified';

export interface GP51Session {
  id: string;
  user_id: string;
  gp51_username: string;
  gp51_token: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export class SupabaseGP51AuthService {
  private currentSession: GP51Session | null = null;

  get isAuthenticated(): boolean {
    return this.currentSession !== null && 
           new Date(this.currentSession.expires_at) > new Date();
  }

  get currentUsername(): string | null {
    return this.currentSession?.gp51_username || null;
  }

  get sessionInfo(): GP51Session | null {
    return this.currentSession;
  }

  async authenticate(username: string, password: string): Promise<GP51AuthResponse> {
    try {
      console.log('🔐 Starting Supabase GP51 authentication...');

      // Check if user is authenticated with Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          status: 1,
          cause: 'Please login to your account first',
          success: false,
          error: 'Supabase authentication required'
        };
      }

      console.log('✅ Supabase session verified, calling GP51 auth...');

      // Call GP51 authentication edge function
      const { data, error } = await supabase.functions.invoke('gp51-secure-auth', {
        body: { username, password }
      });

      if (error) {
        console.error('❌ GP51 auth edge function error:', error);
        return {
          status: 1,
          cause: error.message || 'Authentication failed',
          success: false,
          error: error.message || 'GP51 authentication failed'
        };
      }

      if (!data.success) {
        console.error('❌ GP51 authentication failed:', data.error);
        return {
          status: 1,
          cause: data.error || 'GP51 authentication failed', 
          success: false,
          error: data.error || 'Authentication failed'
        };
      }

      console.log('✅ GP51 authentication successful');

      // Store session info locally
      this.currentSession = {
        id: data.sessionId,
        user_id: session.user.id,
        gp51_token: data.token,
        gp51_username: data.username,
        created_at: data.loginTime,
        expires_at: data.expiresAt,
        is_active: true
      };

      return {
        status: 0,
        cause: 'OK',
        success: true,
        token: data.token,
        sessionId: data.sessionId,
        expiresAt: data.expiresAt
      };

    } catch (error) {
      console.error('💥 GP51 authentication error:', error);
      return {
        status: 1,
        cause: error instanceof Error ? error.message : 'Authentication failed',
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  async loadExistingSession(): Promise<boolean> {
    try {
      console.log('🔍 Loading existing GP51 session...');

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log('❌ No Supabase session found');
        return false;
      }

      // Query active GP51 session from database
      const { data: gp51Sessions, error: gp51Error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (gp51Error || !gp51Sessions || gp51Sessions.length === 0) {
        console.log('❌ No active GP51 session found');
        return false;
      }

      this.currentSession = gp51Sessions[0];
      console.log('✅ GP51 session restored for:', this.currentSession.gp51_username);

      return true;

    } catch (error) {
      console.error('💥 Load session error:', error);
      return false;
    }
  }

  async refreshSession(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    // For now, just check if current session is still valid
    const isValid = new Date(this.currentSession.expires_at) > new Date();
    
    if (!isValid) {
      this.currentSession = null;
    }

    return isValid;
  }

  async logout(): Promise<void> {
    try {
      if (this.currentSession) {
        // Mark session as inactive in database
        await supabase
          .from('gp51_sessions')
          .update({ is_active: false })
          .eq('id', this.currentSession.id);
      }

      this.currentSession = null;
      console.log('✅ GP51 session cleared');

    } catch (error) {
      console.error('💥 Logout error:', error);
      this.currentSession = null;
    }
  }

  async disconnect(): Promise<void> {
    return this.logout();
  }

  // Get session status for health checks
  getSessionStatus() {
    if (!this.currentSession) {
      return {
        isAuthenticated: false,
        currentUsername: null,
        expiresAt: null,
        isExpired: true
      };
    }

    const expiresAt = new Date(this.currentSession.expires_at);
    const isExpired = expiresAt <= new Date();

    return {
      isAuthenticated: !isExpired,
      currentUsername: this.currentSession.gp51_username,
      expiresAt: expiresAt,
      isExpired: isExpired
    };
  }
}

export const supabaseGP51AuthService = new SupabaseGP51AuthService();
