
import { supabase } from '@/integrations/supabase/client';
import type { GP51AuthResponse, GP51Session, GP51SessionRPCResponse } from '@/types/gp51-supabase';

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
        id: data.sessionId || '',
        user_id: session.user.id,
        gp51_token: data.token || '',
        gp51_username: data.username || username,
        created_at: data.loginTime || new Date().toISOString(),
        expires_at: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true
      };

      return {
        status: 0,
        cause: 'OK',
        success: true,
        token: data.token,
        expiresAt: data.expiresAt,
        sessionId: data.sessionId,
        username: data.username,
        loginTime: data.loginTime
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

      // Query active GP51 session using the RPC function
      const { data: gp51Sessions, error: gp51Error } = await supabase
        .rpc('get_active_gp51_session', {
          p_user_id: session.user.id
        });

      if (gp51Error) {
        console.error('❌ RPC error:', gp51Error);
        return false;
      }

      // Handle the response properly - it should be an array
      const sessionArray = Array.isArray(gp51Sessions) ? gp51Sessions : [];
      
      if (sessionArray.length === 0) {
        console.log('❌ No active GP51 session found');
        return false;
      }

      const sessionData = sessionArray[0] as GP51SessionRPCResponse;
      this.currentSession = {
        id: sessionData.id,
        user_id: sessionData.user_id,
        gp51_username: sessionData.gp51_username,
        gp51_token: sessionData.gp51_token,
        created_at: sessionData.created_at,
        expires_at: sessionData.expires_at,
        is_active: sessionData.is_active
      };

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
        // Mark session as inactive in database using edge function
        await supabase.functions.invoke('gp51-logout', {
          body: { sessionId: this.currentSession.id }
        });
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
