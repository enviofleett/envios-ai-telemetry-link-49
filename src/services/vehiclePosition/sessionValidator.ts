
import { supabase } from '@/integrations/supabase/client';

interface SessionValidationResult {
  success: boolean;
  error?: string;
  needsRefresh?: boolean;
  expiresAt?: Date;
  username?: string;
  status?: string;
}

export class GP51SessionValidator {
  private static instance: GP51SessionValidator;
  private lastValidation: SessionValidationResult | null = null;
  private lastValidationTime: Date | null = null;
  private readonly VALIDATION_CACHE_DURATION = 60000; // 1 minute

  static getInstance(): GP51SessionValidator {
    if (!GP51SessionValidator.instance) {
      GP51SessionValidator.instance = new GP51SessionValidator();
    }
    return GP51SessionValidator.instance;
  }

  async testConnection(): Promise<SessionValidationResult> {
    // Use cached result if recent
    if (this.lastValidation && this.lastValidationTime) {
      const timeSinceLastValidation = Date.now() - this.lastValidationTime.getTime();
      if (timeSinceLastValidation < this.VALIDATION_CACHE_DURATION) {
        console.log('🎯 [SESSION-VALIDATOR] Using cached validation result');
        return this.lastValidation;
      }
    }

    console.log('🔍 [SESSION-VALIDATOR] Validating GP51 session...');

    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });

      if (error) {
        const result: SessionValidationResult = {
          success: false,
          error: error.message
        };
        this.cacheValidation(result);
        return result;
      }

      const result: SessionValidationResult = {
        success: data?.isValid || false,
        error: data?.errorMessage,
        needsRefresh: data?.needsRefresh,
        expiresAt: data?.expiresAt ? new Date(data.expiresAt) : undefined,
        username: data?.username,
        status: data?.status
      };

      this.cacheValidation(result);
      return result;

    } catch (error) {
      console.error('❌ [SESSION-VALIDATOR] Validation failed:', error);
      const result: SessionValidationResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Session validation failed'
      };
      this.cacheValidation(result);
      return result;
    }
  }

  private cacheValidation(result: SessionValidationResult): void {
    this.lastValidation = result;
    this.lastValidationTime = new Date();
  }

  forceReset(): void {
    this.lastValidation = null;
    this.lastValidationTime = null;
    console.log('🔄 [SESSION-VALIDATOR] Cache reset, will force fresh validation');
  }
}

export const gp51SessionValidator = GP51SessionValidator.getInstance();
