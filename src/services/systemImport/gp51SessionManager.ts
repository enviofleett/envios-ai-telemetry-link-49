
import { supabase } from '@/integrations/supabase/client';
import { importErrorHandler } from './errorHandler';

export interface GP51Session {
  token: string;
  username: string;
  expiresAt: Date;
  isValid: boolean;
}

export class GP51SessionManager {
  private currentSession: GP51Session | null = null;
  private refreshPromise: Promise<GP51Session> | null = null;

  async validateSession(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiryBuffer = new Date(this.currentSession.expiresAt.getTime() - 5 * 60 * 1000);
    
    if (now >= expiryBuffer) {
      console.log('GP51 session expired or about to expire, needs refresh');
      return false;
    }

    // Test actual connectivity
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error || !data?.success) {
        console.warn('GP51 session validation failed:', error || data);
        return false;
      }

      return true;
    } catch (error) {
      console.error('GP51 session validation error:', error);
      return false;
    }
  }

  async ensureValidSession(): Promise<GP51Session> {
    // If there's already a refresh in progress, wait for it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check if current session is valid
    if (this.currentSession && await this.validateSession()) {
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

  private async refreshSession(): Promise<GP51Session> {
    console.log('Refreshing GP51 session...');
    
    try {
      // Get stored GP51 credentials
      const { data: sessionData, error } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !sessionData || sessionData.length === 0) {
        throw new Error('No GP51 session found. Please authenticate first.');
      }

      const session = sessionData[0];
      
      // Try to refresh the existing session
      const { data: refreshResult, error: refreshError } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'refresh_session',
          username: session.username,
          currentToken: session.gp51_token
        }
      });

      if (refreshError || !refreshResult?.success) {
        // If refresh fails, try re-authentication
        console.log('Session refresh failed, attempting re-authentication');
        return await this.reAuthenticate(session.username);
      }

      // Update current session
      this.currentSession = {
        token: refreshResult.token,
        username: session.username,
        expiresAt: new Date(refreshResult.expiresAt),
        isValid: true
      };

      // Update database
      await supabase
        .from('gp51_sessions')
        .update({
          gp51_token: refreshResult.token,
          token_expires_at: refreshResult.expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('username', session.username);

      console.log('GP51 session refreshed successfully');
      return this.currentSession;

    } catch (error) {
      importErrorHandler.logError(
        'GP51_SESSION_REFRESH_FAILED',
        `Failed to refresh GP51 session: ${error.message}`,
        { error },
        true
      );
      throw error;
    }
  }

  private async reAuthenticate(username: string): Promise<GP51Session> {
    console.log('Re-authenticating with GP51...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { 
          action: 'authenticate',
          username: username,
          forceReauth: true
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'GP51 re-authentication failed');
      }

      this.currentSession = {
        token: data.token,
        username: username,
        expiresAt: new Date(data.expiresAt),
        isValid: true
      };

      console.log('GP51 re-authentication successful');
      return this.currentSession;

    } catch (error) {
      importErrorHandler.logError(
        'GP51_REAUTH_FAILED',
        `Failed to re-authenticate with GP51: ${error.message}`,
        { username, error },
        false
      );
      throw error;
    }
  }

  async withRetry<T>(operation: (session: GP51Session) => Promise<T>, maxRetries: number = 3): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const session = await this.ensureValidSession();
        return await operation(session);
      } catch (error) {
        lastError = error as Error;
        console.warn(`GP51 operation attempt ${attempt} failed:`, error);
        
        // If it's a session-related error, invalidate current session
        if (this.isSessionError(error)) {
          this.currentSession = null;
        }
        
        // If this is the last attempt, don't wait
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }

  private isSessionError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return errorMessage.includes('session') || 
           errorMessage.includes('authentication') || 
           errorMessage.includes('token') ||
           errorMessage.includes('unauthorized');
  }

  getCurrentSession(): GP51Session | null {
    return this.currentSession;
  }

  clearSession(): void {
    this.currentSession = null;
    this.refreshPromise = null;
  }
}

export const gp51SessionManager = new GP51SessionManager();
