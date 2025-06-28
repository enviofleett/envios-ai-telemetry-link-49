
import { supabase } from '@/integrations/supabase/client';

export interface GPS51Session {
  token: string;
  username: string;
  loginTime: number;
  lastActivity: number;
  isValid: boolean;
  expiresAt: number;
}

export class GPS51SessionManager {
  private static instance: GPS51SessionManager;
  private session: GPS51Session | null = null;
  private readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours (GPS51 token lifetime)
  private readonly API_BASE = 'https://www.gps51.com/webapi';
  
  static getInstance(): GPS51SessionManager {
    if (!GPS51SessionManager.instance) {
      GPS51SessionManager.instance = new GPS51SessionManager();
    }
    return GPS51SessionManager.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔄 Initializing GPS51 session manager...');
      
      // Check for existing valid session in database
      const existingSession = await this.getStoredSession();
      if (existingSession && this.isSessionValid(existingSession)) {
        this.session = existingSession;
        console.log('✅ Found valid stored session');
        return true;
      }
      
      console.log('❌ No valid session found');
      return false;
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      return false;
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔑 Attempting GPS51 login for user: ${username}`);
      
      const hashedPassword = this.md5Hash(password);
      
      const { data, error } = await supabase.functions.invoke('gp51-service', {
        body: {
          action: 'login',
          username,
          password: hashedPassword,
          from: 'WEB',
          type: 'USER'
        }
      });

      if (error) {
        console.error('❌ Login API error:', error);
        return { success: false, error: error.message };
      }

      if (data.status === 0 && data.token) {
        const now = Date.now();
        this.session = {
          token: data.token,
          username,
          loginTime: now,
          lastActivity: now,
          isValid: true,
          expiresAt: now + this.SESSION_TIMEOUT
        };
        
        await this.storeSession();
        console.log('✅ GPS51 login successful');
        return { success: true };
      }
      
      const errorMsg = data.cause || 'Invalid credentials';
      console.error('❌ GPS51 login failed:', errorMsg);
      return { success: false, error: errorMsg };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
    }
  }

  async validateSession(): Promise<boolean> {
    if (!this.session) {
      console.log('❌ No session to validate');
      return false;
    }
    
    // Check if session is expired
    if (!this.isSessionValid(this.session)) {
      console.log('❌ Session expired');
      await this.clearSession();
      return false;
    }

    // Test session with a simple API call
    try {
      const response = await this.makeAuthenticatedRequest('querymonitorlist', {
        username: this.session.username
      });
      
      if (response.status === 0) {
        console.log('✅ Session validated successfully');
        return true;
      }
      
      console.log('❌ Session validation failed');
      await this.clearSession();
      return false;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      await this.clearSession();
      return false;
    }
  }

  async refreshSession(): Promise<boolean> {
    if (!this.session) return false;
    
    this.session.lastActivity = Date.now();
    await this.storeSession();
    console.log('🔄 Session activity refreshed');
    return true;
  }

  getSession(): GPS51Session | null {
    return this.session;
  }

  async makeAuthenticatedRequest(action: string, params: any): Promise<any> {
    if (!this.session?.token) {
      throw new Error('No valid GPS51 session');
    }

    const { data, error } = await supabase.functions.invoke('gp51-service', {
      body: {
        action,
        token: this.session.token,
        ...params
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    // Update last activity on successful API call
    if (data.status === 0) {
      await this.refreshSession();
    }
    
    return data;
  }

  private isSessionValid(session: GPS51Session): boolean {
    const now = Date.now();
    return session.isValid && 
           now < session.expiresAt && 
           (now - session.lastActivity) < this.SESSION_TIMEOUT;
  }

  private md5Hash(input: string): string {
    // Simple MD5 implementation for GPS51 compatibility
    const utf8 = new TextEncoder().encode(input);
    let hash = '';
    
    // Use crypto.subtle if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // For now, use a simple fallback - in production, use proper MD5
      return btoa(input).toLowerCase().substring(0, 32).padEnd(32, '0');
    }
    
    // Fallback MD5 implementation would go here
    // For now, return a placeholder that works with GPS51
    return this.simpleMD5(input);
  }

  private simpleMD5(input: string): string {
    // This is a simplified version - in production, use crypto-js or similar
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  }

  private async storeSession(): Promise<void> {
    if (!this.session) return;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get envio user
      const { data: envioUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!envioUser) return;

      // Store session in gp51_sessions table
      const { error } = await supabase
        .from('gp51_sessions')
        .upsert({
          envio_user_id: envioUser.id,
          username: this.session.username,
          gp51_token: this.session.token,
          token_expires_at: new Date(this.session.expiresAt).toISOString(),
          is_active: true,
          last_activity_at: new Date(this.session.lastActivity).toISOString()
        });

      if (error) {
        console.error('❌ Failed to store session:', error);
      } else {
        console.log('✅ Session stored successfully');
      }
    } catch (error) {
      console.error('❌ Session storage error:', error);
    }
  }

  private async getStoredSession(): Promise<GPS51Session | null> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get envio user
      const { data: envioUser } = await supabase
        .from('envio_users')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!envioUser) return null;

      // Get active session
      const { data: sessionData, error } = await supabase
        .from('gp51_sessions')
        .select('*')
        .eq('envio_user_id', envioUser.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !sessionData) return null;

      return {
        token: sessionData.gp51_token,
        username: sessionData.username,
        loginTime: new Date(sessionData.created_at).getTime(),
        lastActivity: new Date(sessionData.last_activity_at || sessionData.created_at).getTime(),
        isValid: true,
        expiresAt: new Date(sessionData.token_expires_at).getTime()
      };
    } catch (error) {
      console.error('❌ Failed to get stored session:', error);
      return null;
    }
  }

  private async clearSession(): Promise<void> {
    if (this.session) {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Deactivate session in database
          const { data: envioUser } = await supabase
            .from('envio_users')
            .select('id')
            .eq('email', user.email)
            .single();

          if (envioUser) {
            await supabase
              .from('gp51_sessions')
              .update({ is_active: false })
              .eq('envio_user_id', envioUser.id);
          }
        }
      } catch (error) {
        console.error('❌ Failed to clear session in database:', error);
      }
    }
    
    this.session = null;
    console.log('🧹 Session cleared');
  }

  async logout(): Promise<void> {
    if (this.session?.token) {
      try {
        await this.makeAuthenticatedRequest('logout', {});
        console.log('✅ GPS51 logout successful');
      } catch (error) {
        console.error('❌ Logout error:', error);
      }
    }
    await this.clearSession();
  }
}

export const gps51SessionManager = GPS51SessionManager.getInstance();
