
import { supabase } from '@/integrations/supabase/client';
import md5 from 'js-md5';

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
  private isInitialized: boolean = false;

  static getInstance(): GPS51SessionManager {
    if (!GPS51SessionManager.instance) {
      GPS51SessionManager.instance = new GPS51SessionManager();
    }
    return GPS51SessionManager.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    
    try {
      await this.restoreSessionFromDatabase();
      this.isInitialized = true;
      console.log('🔐 GPS51SessionManager initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize GPS51SessionManager:', error);
      return false;
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔐 GPS51 login attempt for: ${username}`);
      
      // Create MD5 hash of password
      const passwordHash = md5.hex(password);
      
      // Make login request to GPS51 API
      const response = await this.makeAuthenticatedRequest('login', {
        username,
        password: passwordHash
      });
      
      if (response.status === 0 && response.token) {
        // Store session
        await this.setSessionFromAuth(username, response.token);
        console.log('✅ GPS51 login successful');
        return { success: true };
      }
      
      return { success: false, error: response.cause || 'Login failed' };
    } catch (error) {
      console.error('❌ GPS51 login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('👋 GPS51 logout initiated');
      await this.clearSession();
      console.log('✅ GPS51 logout completed');
    } catch (error) {
      console.error('❌ GPS51 logout error:', error);
    }
  }

  async validateSession(): Promise<boolean> {
    await this.initialize();
    
    try {
      if (!this.currentSession) {
        console.log('🔒 No GPS51 session available');
        return false;
      }

      // Check if session is expired
      if (this.currentSession.expiresAt <= new Date()) {
        console.log('🔒 GPS51 session expired');
        await this.clearSession();
        return false;
      }

      // Validate with GPS51 API
      const response = await this.makeAuthenticatedRequest('querymonitorlist', {});
      
      if (response.status === 0) {
        console.log('✅ GPS51 session validated successfully');
        return true;
      }
      
      console.log('🔒 GPS51 session validation failed with API');
      await this.clearSession();
      return false;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return false;
    }
  }

  async refreshSession(): Promise<boolean> {
    await this.initialize();
    
    try {
      if (!this.currentSession) {
        console.log('🔄 No session to refresh');
        return false;
      }

      // For now, just extend the expiry time
      // In a real implementation, you'd re-authenticate with stored credentials
      const newExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
      this.currentSession.expiresAt = newExpiry;
      this.currentSession.lastActivity = new Date();

      // Update in database
      await this.persistSessionToDatabase();

      console.log('🔄 GPS51 session refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ Session refresh error:', error);
      return false;
    }
  }

  async makeAuthenticatedRequest(action: string, params: any = {}): Promise<any> {
    if (!this.currentSession) {
      throw new Error('No active session for authenticated request');
    }

    const requestBody = {
      action,
      token: this.currentSession.token,
      ...params
    };

    const response = await fetch('https://www.gps51.com/webapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async restoreSessionFromDatabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('envio_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Database error restoring session:', error);
        return;
      }

      if (data && data.gp51_token) {
        const expiresAt = new Date(data.token_expires_at);
        
        if (expiresAt > new Date()) {
          this.currentSession = {
            id: data.id || `session_${Date.now()}`,
            username: data.username,
            token: data.gp51_token,
            expiresAt,
            isValid: true,
            lastActivity: new Date()
          };
          
          console.log('✅ GPS51 session restored from database');
        } else {
          console.log('🔒 Stored session expired, clearing...');
          await this.clearSession();
        }
      }
    } catch (error) {
      console.error('❌ Error restoring session from database:', error);
    }
  }

  async setSessionFromAuth(username: string, token: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 23 * 60 * 60 * 1000);
    
    this.currentSession = {
      id: `session_${Date.now()}`,
      username,
      token,
      expiresAt,
      isValid: true,
      lastActivity: new Date()
    };

    await this.persistSessionToDatabase();
    console.log('✅ GPS51 session set from authentication');
  }

  private async persistSessionToDatabase(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('gp51_sessions')
        .upsert({
          envio_user_id: user.id,
          username: this.currentSession.username,
          password_hash: 'session_managed',
          gp51_token: this.currentSession.token,
          token_expires_at: this.currentSession.expiresAt.toISOString(),
          is_active: true,
          last_activity_at: new Date().toISOString()
        }, {
          onConflict: 'envio_user_id'
        });

      if (error) {
        console.error('❌ Failed to persist session to database:', error);
      } else {
        console.log('✅ Session persisted to database');
      }
    } catch (error) {
      console.error('❌ Error persisting session:', error);
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

  async clearSession(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('gp51_sessions')
          .delete()
          .eq('envio_user_id', user.id);
      }
    } catch (error) {
      console.error('❌ Error clearing session from database:', error);
    }
    
    this.currentSession = null;
  }

  isSessionValid(): boolean {
    return this.currentSession !== null && 
           this.currentSession.isValid && 
           this.currentSession.expiresAt > new Date();
  }
}

export const gps51SessionManager = GPS51SessionManager.getInstance();
