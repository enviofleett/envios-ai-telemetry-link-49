
import { supabase } from '@/integrations/supabase/client';
import { GP51ErrorHandler } from '@/services/gp51ErrorHandler';

export class SessionTester {
  static async testSessionWithRetry(token: string, username: string, maxRetries: number = 2): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Testing GP51 session for ${username} (attempt ${attempt}/${maxRetries})...`);
        
        const { data, error } = await supabase.functions.invoke('gp51-service-management', {
          body: { 
            action: 'validate_token',
            token: token
          }
        });

        if (error) {
          console.warn(`Session test attempt ${attempt} failed:`, error);
          if (attempt === maxRetries) {
            GP51ErrorHandler.logError({
              type: 'api',
              message: `Session validation failed for ${username}`,
              details: error,
              severity: 'high',
              timestamp: new Date()
            });
          }
          continue;
        }

        if (data?.success === true) {
          console.log(`✅ Session validation successful for ${username}`);
          return true;
        }

        console.warn(`Session test returned failure for ${username}:`, data);
        if (attempt === maxRetries) {
          GP51ErrorHandler.logError({
            type: 'authentication',
            message: `Session authentication failed for ${username}`,
            details: data,
            severity: 'high',
            timestamp: new Date()
          });
        }

      } catch (testError) {
        console.warn(`Session test attempt ${attempt} exception:`, testError);
        if (attempt === maxRetries) {
          GP51ErrorHandler.logError({
            type: 'connectivity',
            message: `Session test connection failed for ${username}`,
            details: testError,
            severity: 'high',
            timestamp: new Date()
          });
        }
      }

      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return false;
  }
}
