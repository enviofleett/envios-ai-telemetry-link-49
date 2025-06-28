
import { supabase } from '@/integrations/supabase/client';

export interface GPS51SessionData {
  id: string;
  username: string;
  token: string;
  expiresAt: Date;
  isValid: boolean;
  lastActivity: Date;
}

export class GPS51SessionManager {
  private static instance: GPS51SessionManager;
  private currentSession: GPS51SessionData | null = null;

  static getInstance(): GPS51SessionManager {
    if (!GPS51SessionManager.instance) {
      GPS51SessionManager.instance = new GPS51SessionManager();
    }
    return GPS51SessionManager.instance;
  }

  async validateSession(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        return false;
      }

      // Check if session is expired
      if (this.currentSession.expiresAt <= new Date()) {
        console.log('🔒 GPS51 session expired');
        this.clearSession();
        return false;
      }

      // Validate with backend
      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'session-health-check'
        }
      });

      if (error || !data?.success) {
        console.log('🔒 GPS51 session validation failed');
        this.clearSession();
        return false;
      }

      console.log('✅ GPS51 session validated successfully');
      return true;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
  }

  async refreshSession(): Promise<boolean> {
    try {
      if (!this.currentSession) {
        return false;
      }

      const { data, error } = await supabase.functions.invoke('settings-management', {
        body: {
          action: 'smart-session-refresh'
        }
      });

      if (error || !data?.success) {
        console.log('🔄 GPS51 session refresh failed');
        return false;
      }

      // Update session expiry
      this.currentSession.expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);
      this.currentSession.lastActivity = new Date();

      console.log('🔄 GPS51 session refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      return false;
    }
  }

  setSession(sessionData: Partial<GPS51SessionData>): void {
    this.currentSession = {
      id: sessionData.id || `session_${Date.now()}`,
      username: sessionData.username || '',
      token: sessionData.token || '',
      expiresAt: sessionData.expiresAt || new Date(Date.now() + 23 * 60 * 60 * 1000),
      isValid: sessionData.isValid ?? true,
      lastActivity: new Date()
    };
  }

  getSession(): GPS51SessionData | null {
    return this.currentSession;
  }

  clearSession(): void {
    this.currentSession = null;
  }

  isSessionValid(): boolean {
    return this.currentSession !== null && 
           this.currentSession.isValid && 
           this.currentSession.expiresAt > new Date();
  }
}

export const gps51SessionManager = GPS51SessionManager.getInstance();
