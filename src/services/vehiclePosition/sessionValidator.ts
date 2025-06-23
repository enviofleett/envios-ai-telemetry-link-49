
import { supabase } from '@/integrations/supabase/client';
import { GP51RealConnectionTester } from '@/services/gp51/realConnectionTester';

interface SessionValidationResult {
  valid: boolean;
  token?: string;
  username?: string;
  expiresAt?: string;
  apiUrl?: string;
  error?: string;
  isReallyConnected?: boolean; // NEW: Indicates actual API connectivity
}

class GP51SessionValidator {
  private cache: { result: SessionValidationResult; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async ensureValidSession(): Promise<SessionValidationResult> {
    console.log('🔍 GP51SessionValidator: Performing comprehensive session validation...');
    
    // Check cache first
    if (this.cache && (Date.now() - this.cache.timestamp) < this.CACHE_DURATION) {
      console.log('📋 Using cached session validation result');
      return this.cache.result;
    }

    try {
      // Step 1: Check session existence and validity (old behavior)
      const { data: sessions, error: sessionError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (sessionError || !sessions || sessions.length === 0) {
        const result = { 
          valid: false, 
          error: 'No GP51 sessions found',
          isReallyConnected: false
        };
        this.updateCache(result);
        return result;
      }

      const session = sessions[0];
      const expiresAt = new Date(session.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        const result = { 
          valid: false, 
          error: 'GP51 session expired',
          isReallyConnected: false
        };
        this.updateCache(result);
        return result;
      }

      // Step 2: NEW - Test actual API connectivity beyond just session validity
      console.log('🧪 Testing real GP51 API connectivity...');
      const connectionHealth = await GP51RealConnectionTester.testRealConnection();
      
      const result: SessionValidationResult = {
        valid: session.gp51_token ? true : false,
        token: session.gp51_token,
        username: session.username,
        expiresAt: session.token_expires_at,
        apiUrl: session.api_url,
        isReallyConnected: connectionHealth.isConnected && connectionHealth.dataFlowing,
        error: connectionHealth.isConnected ? undefined : connectionHealth.errorMessage
      };

      // Update cache with comprehensive result
      this.updateCache(result);
      return result;
      
    } catch (error) {
      console.error('❌ Comprehensive session validation failed:', error);
      const result = { 
        valid: false, 
        error: `Session validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isReallyConnected: false
      };
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

  async testConnection(): Promise<{ success: boolean; error?: string; apiUrl?: string; isReallyConnected?: boolean }> {
    console.log('🔧 Testing comprehensive GP51 connection...');
    
    try {
      const sessionResult = await this.ensureValidSession();
      
      if (!sessionResult.valid) {
        return { 
          success: false, 
          error: sessionResult.error || 'No valid session available',
          isReallyConnected: false
        };
      }

      // Return comprehensive connection status
      return { 
        success: sessionResult.isReallyConnected || false,
        error: sessionResult.isReallyConnected ? undefined : sessionResult.error,
        apiUrl: sessionResult.apiUrl,
        isReallyConnected: sessionResult.isReallyConnected
      };
      
    } catch (error) {
      console.error('❌ Exception during comprehensive connection test:', error);
      return { 
        success: false, 
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isReallyConnected: false
      };
    }
  }

  // Force session reset - useful for debugging
  async forceReset(): Promise<void> {
    console.log('🔄 Force resetting GP51 session validator...');
    this.clearCache();
  }
}

export const gp51SessionValidator = new GP51SessionValidator();
