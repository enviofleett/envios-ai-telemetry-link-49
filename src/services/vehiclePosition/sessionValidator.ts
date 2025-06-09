
import { supabase } from '@/integrations/supabase/client';

interface SessionValidationResult {
  valid: boolean;
  token?: string;
  username?: string;
  expiresAt?: string;
  apiUrl?: string;
  error?: string;
}

class GP51SessionValidator {
  private cache: { result: SessionValidationResult; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async ensureValidSession(): Promise<SessionValidationResult> {
    console.log('🔍 GP51SessionValidator: Ensuring valid session...');
    
    // Check cache first
    if (this.cache && (Date.now() - this.cache.timestamp) < this.CACHE_DURATION) {
      console.log('✅ Using cached session validation result');
      return this.cache.result;
    }

    try {
      // Get the most recent valid session
      const { data: sessions, error } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .order('created_at', { ascending: false })
        .order('token_expires_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('❌ Database error fetching GP51 sessions:', error);
        const result = { valid: false, error: 'Database error accessing GP51 sessions' };
        this.updateCache(result);
        return result;
      }

      if (!sessions || sessions.length === 0) {
        console.warn('⚠️ No GP51 sessions found in database');
        const result = { valid: false, error: 'No GP51 sessions configured' };
        this.updateCache(result);
        return result;
      }

      // Find the first non-expired session
      const now = new Date();
      let validSession = null;
      
      for (const session of sessions) {
        const expiresAt = new Date(session.token_expires_at);
        if (expiresAt > now) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        console.warn('⚠️ All GP51 sessions are expired');
        const result = { valid: false, error: 'All GP51 sessions expired' };
        this.updateCache(result);
        return result;
      }

      console.log(`✅ Valid GP51 session found for user: ${validSession.username} with API URL: ${validSession.api_url}`);
      
      const result = {
        valid: true,
        token: validSession.gp51_token,
        username: validSession.username,
        expiresAt: validSession.token_expires_at,
        apiUrl: validSession.api_url || 'https://www.gps51.com'
      };
      
      this.updateCache(result);
      return result;

    } catch (error) {
      console.error('❌ Exception in ensureValidSession:', error);
      const result = { valid: false, error: `Session validation failed: ${error.message}` };
      this.updateCache(result);
      return result;
    }
  }

  private updateCache(result: SessionValidationResult): void {
    this.cache = {
      result,
      timestamp: Date.now()
    };
  }

  clearCache(): void {
    this.cache = null;
    console.log('🧹 GP51SessionValidator cache cleared');
  }

  async testConnection(): Promise<{ success: boolean; error?: string; apiUrl?: string }> {
    console.log('🔧 Testing GP51 connection...');
    
    try {
      const sessionResult = await this.ensureValidSession();
      
      if (!sessionResult.valid) {
        return { 
          success: false, 
          error: sessionResult.error || 'No valid session available'
        };
      }

      // Test connection using the session's API URL
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });
      
      if (error) {
        console.error('❌ GP51 connection test failed:', error);
        return { 
          success: false, 
          error: error.message,
          apiUrl: sessionResult.apiUrl
        };
      }
      
      console.log('✅ GP51 connection test successful');
      return { 
        success: data?.success || false, 
        error: data?.error,
        apiUrl: data?.apiUrl || sessionResult.apiUrl
      };
      
    } catch (error) {
      console.error('❌ Exception during connection test:', error);
      return { 
        success: false, 
        error: `Connection test failed: ${error.message}`
      };
    }
  }
}

export const gp51SessionValidator = new GP51SessionValidator();
