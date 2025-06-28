
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

export interface GPS51LoginResult {
  success: boolean;
  token?: string;
  error?: string;
}

export class GPS51SessionManager {
  private static instance: GPS51SessionManager;
  private currentSession: GPS51SessionData | null = null;
  private isInitialized: boolean = false;
  private readonly API_BASE_URL = 'https://www.gps51.com/webapi';
  private readonly SESSION_TIMEOUT = 23 * 60 * 60 * 1000; // 23 hours

  static getInstance(): GPS51SessionManager {
    if (!GPS51SessionManager.instance) {
      GPS51SessionManager.instance = new GPS51SessionManager();
    }
    return GPS51SessionManager.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return this.isSessionValid();
    
    try {
      console.log('🔄 Initializing GPS51SessionManager...');
      await this.restoreSessionFromDatabase();
      this.isInitialized = true;
      
      const isValid = this.isSessionValid();
      console.log(`🔐 GPS51SessionManager initialized - Valid: ${isValid}`);
      return isValid;
    } catch (error) {
      console.error('❌ Failed to initialize GPS51SessionManager:', error);
      return false;
    }
  }

  async login(username: string, password: string): Promise<GPS51LoginResult> {
    try {
      console.log(`🔐 GPS51 login attempt for: ${username}`);
      
      // Hash password using MD5 as required by GPS51 API
      const hashedPassword = md5(password);
      
      const response = await fetch(`${this.API_BASE_URL}?action=login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        })
      });

      const data = await response.json();
      
      if (data.status === 0 && data.token) {
        // Create session object
        const expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);
        
        this.currentSession = {
          id: `session_${Date.now()}`,
          username,
          token: data.token,
          expiresAt,
          isValid: true,
          lastActivity: new Date()
        };

        // Store in database
        await this.persistSessionToDatabase(hashedPassword);
        
        console.log('✅ GPS51 login successful');
        return {
          success: true,
          token: data.token
        };
      } else {
        console.error('❌ GPS51 login failed:', data.cause || 'Unknown error');
        return {
          success: false,
          error: data.cause || 'Login failed'
        };
      }
    } catch (error) {
      console.error('❌ GPS51 login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  async validateSession(): Promise<boolean> {
    if (!this.currentSession) {
      console.log('🔒 No GPS51 session to validate');
      return false;
    }

    // Check if session is expired
    if (this.currentSession.expiresAt <= new Date()) {
      console.log('🔒 GPS51 session expired');
      await this.clearSession();
      return false;
    }

    try {
      // Test session with a simple API call
      const response = await this.makeAuthenticatedRequest('querymonitorlist', {});
      
      if (response.status === 0) {
        console.log('✅ GPS51 session validated successfully');
        await this.updateLastActivity();
        return true;
      } else {
        console.log('🔒 GPS51 session validation failed');
        await this.clearSession();
        return false;
      }
    } catch (error) {
      console.error('❌ GPS51 session validation error:', error);
      await this.clearSession();
      return false;
    }
  }

  async refreshSession(): Promise<boolean> {
    if (!this.currentSession) {
      console.log('🔄 No session to refresh');
      return false;
    }
    
    try {
      // For now, just extend the expiry time and update activity
      // In a full implementation, you might need to re-authenticate
      this.currentSession.expiresAt = new Date(Date.now() + this.SESSION_TIMEOUT);
      this.currentSession.lastActivity = new Date();
      
      // Update in database
      await this.updateSessionInDatabase();
      
      console.log('🔄 GPS51 session refreshed successfully');
      return true;
    } catch (error) {
      console.error('❌ GPS51 session refresh error:', error);
      return false;
    }
  }

  async makeAuthenticatedRequest(action: string, params: any): Promise<any> {
    if (!this.currentSession?.token) {
      throw new Error('No valid GPS51 session available');
    }

    const url = `${this.API_BASE_URL}?action=${action}&token=${this.currentSession.token}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();
    
    // Update last activity on successful request
    if (data.status === 0) {
      await this.updateLastActivity();
    }
    
    return data;
  }

  getSession(): GPS51SessionData | null {
    return this.currentSession;
  }

  isSessionValid(): boolean {
    return this.currentSession !== null && 
           this.currentSession.isValid && 
           this.currentSession.expiresAt > new Date();
  }

  private async restoreSessionFromDatabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user for session restoration');
        return;
      }

      const { data, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('envio_user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Database error restoring session:', error);
        return;
      }

      if (data && data.gp51_token && data.token_expires_at) {
        const expiresAt = new Date(data.token_expires_at);
        
        if (expiresAt > new Date()) {
          this.currentSession = {
            id: data.id || `session_${Date.now()}`,
            username: data.username,
            token: data.gp51_token,
            expiresAt,
            isValid: true,
            lastActivity: new Date(data.last_activity_at || data.created_at)
          };
          
          console.log('✅ GPS51 session restored from database');
        } else {
          console.log('🔒 Stored session expired, clearing...');
          await this.clearSessionFromDatabase();
        }
      }
    } catch (error) {
      console.error('❌ Error restoring session from database:', error);
    }
  }

  private async persistSessionToDatabase(passwordHash: string): Promise<void> {
    if (!this.currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user for session persistence');
        return;
      }

      // Clear any existing active sessions first
      await supabase
        .from('gp51_sessions')
        .update({ is_active: false })
        .eq('envio_user_id', user.id);

      // Insert new session
      const { error } = await supabase
        .from('gp51_sessions')
        .insert({
          envio_user_id: user.id,
          username: this.currentSession.username,
          password_hash: passwordHash, // Required field
          gp51_token: this.currentSession.token,
          token_expires_at: this.currentSession.expiresAt.toISOString(),
          is_active: true,
          last_activity_at: this.currentSession.lastActivity.toISOString()
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

  private async updateSessionInDatabase(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('gp51_sessions')
        .update({
          token_expires_at: this.currentSession.expiresAt.toISOString(),
          last_activity_at: this.currentSession.lastActivity.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('envio_user_id', user.id)
        .eq('is_active', true);

      if (error) {
        console.error('❌ Failed to update session in database:', error);
      }
    } catch (error) {
      console.error('❌ Error updating session:', error);
    }
  }

  private async updateLastActivity(): Promise<void> {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date();
      await this.updateSessionInDatabase();
    }
  }

  async clearSession(): Promise<void> {
    try {
      await this.clearSessionFromDatabase();
      this.currentSession = null;
      console.log('🗑️ GPS51 session cleared');
    } catch (error) {
      console.error('❌ Error clearing session:', error);
    }
  }

  private async clearSessionFromDatabase(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('gp51_sessions')
          .update({ is_active: false })
          .eq('envio_user_id', user.id);
      }
    } catch (error) {
      console.error('❌ Error clearing session from database:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.currentSession?.token) {
        // Try to logout from GPS51 API
        await this.makeAuthenticatedRequest('logout', {});
      }
    } catch (error) {
      console.error('❌ GPS51 logout API error:', error);
    } finally {
      await this.clearSession();
    }
  }
}

export const gps51SessionManager = GPS51SessionManager.getInstance();
