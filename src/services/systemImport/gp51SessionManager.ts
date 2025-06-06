
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
  private refreshInterval: number | null = null;
  private isLongRunningOperation = false;

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

    // Test actual connectivity using the test_connection action
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        console.warn('GP51 session validation failed:', error);
        return false;
      }

      if (!data?.success) {
        console.warn('GP51 session validation returned false:', data);
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
    this.refreshPromise = this.getStoredSession();
    
    try {
      const session = await this.refreshPromise;
      this.refreshPromise = null;
      return session;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  startLongRunningOperation(): void {
    console.log('Starting long-running operation with periodic session validation...');
    this.isLongRunningOperation = true;
    
    // Validate session every 10 minutes during long operations
    this.refreshInterval = window.setInterval(async () => {
      try {
        console.log('Performing periodic session validation for long-running operation...');
        const isValid = await this.validateSession();
        if (!isValid) {
          console.warn('Session validation failed during long-running operation');
          importErrorHandler.logError(
            'GP51_SESSION_VALIDATION_WARNING',
            'Session validation failed during long-running operation. Please check GP51 connection in Admin Settings if issues persist.',
            {},
            false
          );
        } else {
          console.log('Periodic session validation completed successfully');
        }
      } catch (error) {
        console.error('Periodic session validation failed:', error);
        importErrorHandler.logError(
          'GP51_PERIODIC_VALIDATION_FAILED',
          `Periodic session validation failed: ${error.message}`,
          { error },
          false
        );
      }
    }, 10 * 60 * 1000); // 10 minutes
  }

  stopLongRunningOperation(): void {
    console.log('Stopping long-running operation session management...');
    this.isLongRunningOperation = false;
    
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async getStoredSession(): Promise<GP51Session> {
    console.log('Getting stored GP51 session...');
    
    try {
      // Get the most recent valid GP51 session
      const { data: sessionData, error } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at')
        .order('created_at', { ascending: false })
        .order('token_expires_at', { ascending: false })
        .limit(5); // Get multiple sessions to find a valid one

      if (error || !sessionData || sessionData.length === 0) {
        throw new Error('No GP51 sessions found. Please authenticate in Admin Settings first.');
      }

      // Find the first non-expired session
      let validSession = null;
      const now = new Date();
      
      for (const session of sessionData) {
        const expiresAt = new Date(session.token_expires_at);
        if (expiresAt > now) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        throw new Error('All GP51 sessions are expired. Please re-authenticate in Admin Settings.');
      }

      console.log('Found valid GP51 session for user:', validSession.username);
      
      // Test the session to make sure it works
      const { data: testResult, error: testError } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (testError || !testResult?.success) {
        console.warn('Stored session failed validation, but may still be usable:', testError || testResult);
        // Don't throw error here - let the calling code handle it
      }

      // Update current session
      this.currentSession = {
        token: validSession.gp51_token,
        username: validSession.username,
        expiresAt: new Date(validSession.token_expires_at),
        isValid: true
      };

      console.log('GP51 session loaded successfully for user:', validSession.username);
      return this.currentSession;

    } catch (error) {
      importErrorHandler.logError(
        'GP51_SESSION_LOAD_FAILED',
        `Failed to load GP51 session: ${error.message}`,
        { error },
        true
      );
      throw error;
    }
  }

  async withRetry<T>(operation: (session: GP51Session) => Promise<T>, maxRetries: number = 2): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const session = await this.ensureValidSession();
        return await operation(session);
      } catch (error) {
        lastError = error as Error;
        console.warn(`GP51 operation attempt ${attempt} failed:`, error);
        
        // If it's a session-related error, clear current session
        if (this.isSessionError(error)) {
          console.log('Clearing session due to session-related error');
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
    
    // Provide a more helpful error message
    const errorMessage = lastError?.message || 'Unknown error';
    if (this.isSessionError(lastError)) {
      throw new Error(`GP51 session authentication failed: ${errorMessage}. Please refresh your GP51 connection in Admin Settings.`);
    }
    
    throw lastError!;
  }

  private isSessionError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';
    return errorMessage.includes('session') || 
           errorMessage.includes('authentication') || 
           errorMessage.includes('token') ||
           errorMessage.includes('unauthorized') ||
           errorMessage.includes('invalid');
  }

  getCurrentSession(): GP51Session | null {
    return this.currentSession;
  }

  clearSession(): void {
    this.currentSession = null;
    this.refreshPromise = null;
    this.stopLongRunningOperation();
  }

  isInLongRunningOperation(): boolean {
    return this.isLongRunningOperation;
  }

  // Helper method to check if we have any valid sessions without throwing errors
  async hasValidSession(): Promise<boolean> {
    try {
      await this.ensureValidSession();
      return true;
    } catch (error) {
      console.log('No valid session available:', error.message);
      return false;
    }
  }
}

export const gp51SessionManager = new GP51SessionManager();
