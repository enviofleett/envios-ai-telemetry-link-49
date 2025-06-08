
import { supabase } from '@/integrations/supabase/client';

export interface GP51Error {
  type: 'authentication' | 'connectivity' | 'session' | 'api' | 'data';
  message: string;
  details?: any;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class GP51ErrorHandler {
  private static errors: GP51Error[] = [];
  private static maxErrors = 100;

  static logError(error: GP51Error): void {
    this.errors.unshift({
      ...error,
      timestamp: new Date()
    });

    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    console.error(`GP51 ${error.type} error:`, error.message, error.details);

    // Store critical errors in database for monitoring
    if (error.severity === 'critical') {
      this.storeCriticalError(error);
    }
  }

  private static async storeCriticalError(error: GP51Error): Promise<void> {
    try {
      await supabase
        .from('gp51_connection_health')
        .insert({
          status: 'error',
          error_message: error.message,
          session_info: error.details
        });
    } catch (dbError) {
      console.error('Failed to store critical GP51 error:', dbError);
    }
  }

  static getRecentErrors(count: number = 10): GP51Error[] {
    return this.errors.slice(0, count);
  }

  static getCriticalErrors(): GP51Error[] {
    return this.errors.filter(error => error.severity === 'critical');
  }

  static clearErrors(): void {
    this.errors = [];
  }

  static hasActiveCriticalErrors(): boolean {
    const recentCriticalErrors = this.errors.filter(
      error => error.severity === 'critical' && 
      Date.now() - error.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );
    return recentCriticalErrors.length > 0;
  }
}
