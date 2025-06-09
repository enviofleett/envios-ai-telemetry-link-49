
import { supabase } from '@/integrations/supabase/client';
import { importErrorHandler } from './errorHandler';
import { enhancedSessionValidator } from '../enhancedSessionValidator';
import type { EnhancedSessionResult } from '../sessionValidation/types';

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
    try {
      console.log('GP51SessionManager: Validating session using enhanced validator...');
      
      // Use the enhanced session validator
      const validation = await enhancedSessionValidator.validateSession();
      
      if (validation.valid && validation.token) {
        // Update our current session with the validated session
        this.currentSession = {
          token: validation.token,
          username: validation.username!,
          expiresAt: new Date(validation.expiresAt!),
          isValid: true
        };
        
        console.log(`✅ Session validated successfully for ${validation.username}`);
        return true;
      }

      console.warn('Session validation failed:', validation.error);
      this.currentSession = null;
      return false;
      
    } catch (error) {
      console.error('GP51 session validation error:', error);
      this.currentSession = null;
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

    // Start session refresh/acquisition
    this.refreshPromise = this.acquireValidSession();
    
    try {
      const session = await this.refreshPromise;
      this.refreshPromise = null;
      return session;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async acquireValidSession(): Promise<GP51Session> {
    console.log('Acquiring valid GP51 session...');
    
    try {
      // Use the enhanced session validator to get a valid session
      const validation = await enhancedSessionValidator.ensureValidSession();
      
      if (!validation.valid || !validation.token) {
        throw new Error(validation.error || 'Failed to acquire valid GP51 session');
      }

      // Create session object
      this.currentSession = {
        token: validation.token,
        username: validation.username!,
        expiresAt: new Date(validation.expiresAt!),
        isValid: true
      };

      console.log(`✅ Valid GP51 session acquired for user: ${validation.username}`);
      return this.currentSession;

    } catch (error) {
      importErrorHandler.logError(
        'GP51_SESSION_ACQUISITION_FAILED',
        `Failed to acquire valid GP51 session: ${error.message}`,
        { error },
        true
      );
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
          console.warn('Session became invalid during long-running operation, attempting to reacquire...');
          await this.ensureValidSession();
        }
        console.log('Periodic session validation completed successfully');
      } catch (error) {
        console.error('Periodic session validation failed:', error);
        importErrorHandler.logError(
          'GP51_PERIODIC_VALIDATION_FAILED',
          `Periodic session validation failed: ${error.message}`,
          { error },
          true
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
          console.log('Session error detected, clearing current session');
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
           errorMessage.includes('unauthorized') ||
           errorMessage.includes('expired');
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

  // Enhanced method for import operations
  async prepareForImport(): Promise<GP51Session> {
    console.log('Preparing GP51 session for import operation...');
    
    try {
      // Ensure we have a valid session before starting import
      const session = await this.ensureValidSession();
      
      // Start long-running operation management
      this.startLongRunningOperation();
      
      console.log(`✅ GP51 session ready for import operation (user: ${session.username})`);
      return session;
      
    } catch (error) {
      console.error('Failed to prepare GP51 session for import:', error);
      throw new Error(`Import preparation failed: ${error.message}`);
    }
  }

  cleanupAfterImport(): void {
    console.log('Cleaning up GP51 session after import operation...');
    this.stopLongRunningOperation();
  }
}

export const gp51SessionManager = new GP51SessionManager();
