
import { supabase } from '@/integrations/supabase/client';
import { gp51ErrorReporter } from './errorReporter';

export interface GP51SessionValidationResult {
  valid: boolean;
  token?: string;
  username?: string;
  expiresAt?: string;
  apiUrl?: string;
  error?: string;
  retryCount?: number;
}

class EnhancedGP51SessionValidator {
  private static instance: EnhancedGP51SessionValidator;
  private cache: { result: GP51SessionValidationResult; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private validationInProgress = false;

  static getInstance(): EnhancedGP51SessionValidator {
    if (!EnhancedGP51SessionValidator.instance) {
      EnhancedGP51SessionValidator.instance = new EnhancedGP51SessionValidator();
    }
    return EnhancedGP51SessionValidator.instance;
  }

  async validateGP51Session(retryCount = 0): Promise<GP51SessionValidationResult> {
    // Return cached result if still valid
    if (this.isCacheValid() && retryCount === 0) {
      console.log('📦 Using cached enhanced GP51 session validation result');
      return this.cache!.result;
    }

    // Prevent concurrent validations
    if (this.validationInProgress) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.validateGP51Session(retryCount);
    }

    this.validationInProgress = true;

    try {
      console.log('🔍 Enhanced GP51 session validation starting...');

      // First check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        const result = { 
          valid: false, 
          error: 'Authentication required - please refresh the page and log in',
          retryCount 
        };
        this.updateCache(result);
        return result;
      }

      // Check GP51 sessions table with correct column names
      const { data: sessions, error: dbError } = await supabase
        .from('gp51_sessions')
        .select('username, gp51_token, token_expires_at, api_url')
        .order('token_expires_at', { ascending: false })
        .limit(1);

      if (dbError) {
        console.error('❌ Enhanced validation database error:', dbError);
        const result = { 
          valid: false, 
          error: `Database error: ${dbError.message}`,
          retryCount 
        };
        this.updateCache(result);
        return result;
      }

      if (!sessions || sessions.length === 0) {
        console.log('⚠️ No GP51 sessions found in enhanced validation');
        const result = { 
          valid: false, 
          error: 'No GP51 sessions configured',
          retryCount 
        };
        this.updateCache(result);
        return result;
      }

      const session_data = sessions[0];
      const expiresAt = new Date(session_data.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        console.log('⏰ GP51 session expired in enhanced validation');
        const result = { 
          valid: false, 
          username: session_data.username,
          expiresAt: session_data.token_expires_at,
          error: 'GP51 session expired - please refresh credentials',
          retryCount 
        };
        this.updateCache(result);
        return result;
      }

      console.log('✅ Enhanced GP51 session validation successful');
      const result = {
        valid: true,
        username: session_data.username,
        expiresAt: session_data.token_expires_at,
        token: session_data.gp51_token,
        apiUrl: session_data.api_url,
        retryCount
      };
      this.updateCache(result);
      return result;

    } catch (error) {
      console.error('❌ Enhanced session validation failed:', error);
      
      gp51ErrorReporter.reportError({
        type: 'session',
        message: 'Enhanced GP51 session validation failed',
        details: error,
        severity: 'high'
      });

      const result = { 
        valid: false, 
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        retryCount 
      };
      this.updateCache(result);
      return result;
    } finally {
      this.validationInProgress = false;
    }
  }

  forceRevalidation(): void {
    console.log('🔄 Forcing enhanced GP51 session revalidation');
    this.clearCache();
    this.validationInProgress = false;
  }

  clearCache(): void {
    console.log('🧹 Clearing enhanced GP51 session validator cache');
    this.cache = null;
  }

  private isCacheValid(): boolean {
    return this.cache !== null && new Date().getTime() < this.cache.timestamp + this.CACHE_DURATION;
  }

  private updateCache(result: GP51SessionValidationResult): void {
    this.cache = {
      result,
      timestamp: new Date().getTime()
    };
  }
}

// Export the instance
export const enhancedGP51SessionValidator = EnhancedGP51SessionValidator.getInstance();

// Enhanced API service with proper return types
interface SyncResult {
  success: boolean;
  result?: {
    devicesFound: number;
    positionsFetched: number;
  };
  error?: string;
}

interface SyncStatus {
  isRunning: boolean;
  lastSync: Date | null;
  nextSync: Date | null;
  activeLocks?: Array<{ key: string; timestamp: Date }>;
}

class EnhancedGP51ApiService {
  async performFullSync(): Promise<SyncResult> {
    try {
      // Placeholder implementation - would normally perform actual sync
      return {
        success: true,
        result: {
          devicesFound: 0,
          positionsFetched: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown sync error'
      };
    }
  }

  getSyncStatus(): SyncStatus {
    // Placeholder implementation
    return {
      isRunning: false,
      lastSync: null,
      nextSync: null,
      activeLocks: []
    };
  }
}

export const enhancedGP51ApiService = new EnhancedGP51ApiService();
