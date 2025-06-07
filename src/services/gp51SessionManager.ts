
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GP51SessionInfo {
  token: string;
  username: string;
  expiresAt: Date;
  isValid: boolean;
}

export class GP51SessionManager {
  private static instance: GP51SessionManager;
  private currentSession: GP51SessionInfo | null = null;
  private refreshPromise: Promise<GP51SessionInfo> | null = null;
  private sessionListeners: Set<(session: GP51SessionInfo | null) => void> = new Set();

  static getInstance(): GP51SessionManager {
    if (!GP51SessionManager.instance) {
      GP51SessionManager.instance = new GP51SessionManager();
    }
    return GP51SessionManager.instance;
  }

  async validateAndEnsureSession(): Promise<GP51SessionInfo> {
    console.log('🔍 Validating and ensuring GP51 session...');

    // If refresh is in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check current session validity
    if (this.currentSession && await this.isSessionValid(this.currentSession)) {
      console.log('✅ Current session is valid');
      return this.currentSession;
    }

    // Start session refresh
    this.refreshPromise = this.refreshSession();
    
    try {
      const session = await this.refreshPromise;
      this.refreshPromise = null;
      return session;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async isSessionValid(session: GP51SessionInfo): Promise<boolean> {
    // Check expiration time
    const now = new Date();
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    
    if (timeUntilExpiry <= 5 * 60 * 1000) { // 5 minutes buffer
      console.log('⏰ Session expires soon, needs refresh');
      return false;
    }

    // Test with GP51 API
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'validate_token', token: session.token }
      });

      return !error && data?.success === true;
    } catch (error) {
      console.warn('Session validation test failed:', error);
      return false;
    }
  }

  private async refreshSession(): Promise<GP51SessionInfo> {
    console.log('🔄 Refreshing GP51 session...');

    try {
      // Get latest session from database
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !sessions || sessions.length === 0) {
        throw new Error('No GP51 sessions found. Please authenticate in Admin Settings.');
      }

      const latestSession = sessions[0];
      const expiresAt = new Date(latestSession.token_expires_at);
      const now = new Date();

      // If session is expired, try to refresh via service
      if (expiresAt <= now) {
        console.log('🔄 Session expired, attempting service refresh...');
        
        const { data, error: refreshError } = await supabase.functions.invoke('gp51-service-management', {
          body: { action: 'refresh_session' }
        });

        if (refreshError || !data?.success) {
          // Clear invalid sessions and force re-authentication
          await this.clearInvalidSessions();
          throw new Error('Session refresh failed. Please re-authenticate in Admin Settings.');
        }

        // Update session with new token
        const { error: updateError } = await supabase
          .from('gp51_sessions')
          .update({
            gp51_token: data.token,
            token_expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', latestSession.id);

        if (updateError) {
          console.error('Failed to update session:', updateError);
        }

        // Create new session info
        this.currentSession = {
          token: data.token,
          username: latestSession.username,
          expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
          isValid: true
        };
      } else {
        // Use existing valid session
        this.currentSession = {
          token: latestSession.gp51_token,
          username: latestSession.username,
          expiresAt: expiresAt,
          isValid: true
        };
      }

      console.log(`✅ Session refreshed for user: ${this.currentSession.username}`);
      this.notifyListeners(this.currentSession);
      return this.currentSession;

    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      this.currentSession = null;
      this.notifyListeners(null);
      throw error;
    }
  }

  private async clearInvalidSessions(): Promise<void> {
    try {
      console.log('🧹 Clearing invalid GP51 sessions...');
      
      const { error } = await supabase
        .from('gp51_sessions')
        .delete()
        .lt('token_expires_at', new Date().toISOString());

      if (error) {
        console.error('Failed to clear invalid sessions:', error);
      } else {
        console.log('✅ Invalid sessions cleared');
      }
    } catch (error) {
      console.error('Error clearing invalid sessions:', error);
    }
  }

  getCurrentSession(): GP51SessionInfo | null {
    return this.currentSession;
  }

  subscribe(callback: (session: GP51SessionInfo | null) => void): () => void {
    this.sessionListeners.add(callback);
    
    // Send current session immediately
    if (this.currentSession) {
      callback(this.currentSession);
    }

    return () => {
      this.sessionListeners.delete(callback);
    };
  }

  private notifyListeners(session: GP51SessionInfo | null): void {
    this.sessionListeners.forEach(callback => {
      try {
        callback(session);
      } catch (error) {
        console.error('Error notifying session listener:', error);
      }
    });
  }

  async forceReauthentication(): Promise<void> {
    console.log('🔄 Forcing GP51 re-authentication...');
    this.currentSession = null;
    await this.clearInvalidSessions();
    this.notifyListeners(null);
  }
}

export const gp51SessionManager = GP51SessionManager.getInstance();
