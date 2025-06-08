
import { supabase } from '@/integrations/supabase/client';
import { degradationService } from '@/services/reliability/DegradationService';
import { User, Session } from '@supabase/supabase-js';

export type AuthenticationLevel = 'full' | 'degraded' | 'minimal' | 'offline';

export interface GP51AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  level: AuthenticationLevel;
  error?: string;
  token?: string;
}

export interface CachedGP51Session {
  token: string;
  username: string;
  expiresAt: Date;
  userId: string;
}

export class GP51FallbackAuthService {
  private static instance: GP51FallbackAuthService;
  private currentLevel: AuthenticationLevel = 'full';

  static getInstance(): GP51FallbackAuthService {
    if (!GP51FallbackAuthService.instance) {
      GP51FallbackAuthService.instance = new GP51FallbackAuthService();
    }
    return GP51FallbackAuthService.instance;
  }

  async authenticateWithFallback(username: string, password: string): Promise<GP51AuthResult> {
    console.log('Starting GP51 authentication with fallback strategy');

    // Level 1: Try direct GP51 authentication
    try {
      const gp51Result = await this.authenticateWithGP51(username, password);
      if (gp51Result.success) {
        this.currentLevel = 'full';
        degradationService.resetService('gp51');
        return gp51Result;
      }
    } catch (error) {
      console.warn('GP51 direct authentication failed:', error);
      degradationService.degradeService('gp51', 'degraded');
    }

    // Level 2: Try cached GP51 session
    try {
      const cachedResult = await this.authenticateWithCachedGP51(username);
      if (cachedResult.success) {
        this.currentLevel = 'degraded';
        return cachedResult;
      }
    } catch (error) {
      console.warn('Cached GP51 authentication failed:', error);
      degradationService.degradeService('gp51', 'minimal');
    }

    // Level 3: Try Supabase email/password fallback
    try {
      const supabaseResult = await this.authenticateWithSupabase(username, password);
      if (supabaseResult.success) {
        this.currentLevel = 'minimal';
        return supabaseResult;
      }
    } catch (error) {
      console.warn('Supabase fallback authentication failed:', error);
      degradationService.degradeService('gp51', 'offline');
    }

    // Level 4: Offline mode with browser session
    const offlineResult = await this.authenticateOffline(username);
    this.currentLevel = 'offline';
    return offlineResult;
  }

  private async authenticateWithGP51(username: string, password: string): Promise<GP51AuthResult> {
    const { data, error } = await supabase.functions.invoke('settings-management', {
      body: { action: 'save-gp51-credentials', username, password }
    });

    if (error || !data?.success) {
      throw new Error(data?.error || 'GP51 authentication failed');
    }

    // Create or update user in Supabase
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: `${username}@gp51.local`,
      password: password
    });

    if (authError) {
      // Try to create user if doesn't exist
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: `${username}@gp51.local`,
        password: password,
        options: {
          data: {
            full_name: username,
            gp51_username: username
          }
        }
      });

      if (signUpError) {
        throw new Error('Failed to create user account');
      }

      return {
        success: true,
        user: signUpData.user!,
        session: signUpData.session!,
        level: 'full',
        token: data.token
      };
    }

    const { data: { session } } = await supabase.auth.getSession();

    return {
      success: true,
      user,
      session: session!,
      level: 'full',
      token: data.token
    };
  }

  private async authenticateWithCachedGP51(username: string): Promise<GP51AuthResult> {
    const { data: sessions, error } = await supabase
      .from('gp51_sessions')
      .select('*')
      .eq('username', username)
      .gt('token_expires_at', new Date().toISOString())
      .order('token_expires_at', { ascending: false })
      .limit(1);

    if (error || !sessions || sessions.length === 0) {
      throw new Error('No valid cached GP51 session found');
    }

    const session = sessions[0];
    
    // Try to sign in with cached session info
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: `${username}@gp51.local`,
      password: 'cached-session'
    });

    if (authError) {
      throw new Error('Failed to authenticate with cached session');
    }

    const { data: { session: supabaseSession } } = await supabase.auth.getSession();

    return {
      success: true,
      user,
      session: supabaseSession!,
      level: 'degraded',
      token: session.gp51_token
    };
  }

  private async authenticateWithSupabase(username: string, password: string): Promise<GP51AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username.includes('@') ? username : `${username}@gp51.local`,
      password: password
    });

    if (error) {
      throw new Error('Supabase authentication failed');
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
      level: 'minimal'
    };
  }

  private async authenticateOffline(username: string): Promise<GP51AuthResult> {
    // Check for stored offline session
    const offlineSession = localStorage.getItem(`offline_session_${username}`);
    
    if (offlineSession) {
      try {
        const sessionData = JSON.parse(offlineSession);
        const expiresAt = new Date(sessionData.expiresAt);
        
        if (expiresAt > new Date()) {
          return {
            success: true,
            level: 'offline',
            user: sessionData.user,
            session: sessionData.session
          };
        }
      } catch (error) {
        console.warn('Invalid offline session data');
      }
    }

    return {
      success: false,
      level: 'offline',
      error: 'No valid authentication method available. System is operating in offline mode.'
    };
  }

  getCurrentLevel(): AuthenticationLevel {
    return this.currentLevel;
  }

  async checkGP51Health(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: { action: 'get-gp51-status' }
      });

      return !error && data?.connected;
    } catch (error) {
      return false;
    }
  }

  storeOfflineSession(username: string, user: User, session: Session): void {
    const offlineData = {
      user,
      session,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    localStorage.setItem(`offline_session_${username}`, JSON.stringify(offlineData));
  }

  clearOfflineSession(username: string): void {
    localStorage.removeItem(`offline_session_${username}`);
  }
}

export const gp51FallbackAuth = GP51FallbackAuthService.getInstance();
