
import { supabase } from '@/integrations/supabase/client';
import { enhancedGP51SessionValidator } from './enhancedSessionValidator';

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
    console.log('🔍 GP51SessionValidator: Delegating to enhanced validator...');
    
    // Use the enhanced validator which has better retry logic and error handling
    try {
      const result = await enhancedGP51SessionValidator.validateGP51Session();
      
      // Convert the enhanced result to our expected format
      const validationResult: SessionValidationResult = {
        valid: result.valid,
        token: result.token,
        username: result.username,
        expiresAt: result.expiresAt,
        apiUrl: result.apiUrl,
        error: result.error
      };

      // Update our cache with the result
      this.updateCache(validationResult);
      return validationResult;
      
    } catch (error) {
      console.error('❌ Enhanced session validation failed:', error);
      const result = { 
        valid: false, 
        error: `Enhanced validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
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
    enhancedGP51SessionValidator.clearCache();
    console.log('🧹 GP51SessionValidator cache cleared (including enhanced validator)');
  }

  async testConnection(): Promise<{ success: boolean; error?: string; apiUrl?: string }> {
    console.log('🔧 Testing GP51 connection using enhanced validator...');
    
    try {
      const sessionResult = await this.ensureValidSession();
      
      if (!sessionResult.valid) {
        return { 
          success: false, 
          error: sessionResult.error || 'No valid session available'
        };
      }

      // Additional connection test using the service
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
      
      console.log('✅ GP51 connection test successful via enhanced validator');
      return { 
        success: data?.success || false, 
        error: data?.error,
        apiUrl: data?.apiUrl || sessionResult.apiUrl
      };
      
    } catch (error) {
      console.error('❌ Exception during enhanced connection test:', error);
      return { 
        success: false, 
        error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Force session reset - useful for debugging
  async forceReset(): Promise<void> {
    console.log('🔄 Force resetting GP51 session validator...');
    this.clearCache();
    enhancedGP51SessionValidator.forceRevalidation();
  }
}

export const gp51SessionValidator = new GP51SessionValidator();
