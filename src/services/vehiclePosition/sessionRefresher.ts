
import { supabase } from '@/integrations/supabase/client';
import { GP51ErrorHandler } from '@/services/gp51ErrorHandler';
import { SessionValidationResult } from './types';

export class GP51SessionRefresher {
  static async refreshGP51Session(): Promise<SessionValidationResult> {
    console.log('🔄 Attempting GP51 session refresh...');
    
    try {
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'refresh_session' }
      });

      if (error || !data?.success) {
        GP51ErrorHandler.logError({
          type: 'authentication',
          message: 'Session refresh failed',
          details: error || data,
          severity: 'high',
          timestamp: new Date()
        });
        return this.createErrorResult('Session refresh failed');
      }

      console.log('✅ GP51 session refreshed successfully');
      
      return {
        valid: true,
        username: data.username,
        expiresAt: data.expiresAt,
        token: data.token
      };

    } catch (error) {
      GP51ErrorHandler.logError({
        type: 'api',
        message: 'Session refresh exception',
        details: error,
        severity: 'high',
        timestamp: new Date()
      });
      return this.createErrorResult(`Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static createErrorResult(message: string): SessionValidationResult {
    return {
      valid: false,
      error: message
    };
  }
}
