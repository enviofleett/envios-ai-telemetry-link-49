
import { logger } from '../logging/ProductionLogger';

export interface GP51Error {
  type: 'authentication' | 'connectivity' | 'session' | 'api' | 'data';
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class GP51ErrorHandler {
  private static errors: GP51Error[] = [];
  private static maxErrors = 50; // Reduced from 100

  static logError(error: GP51Error): void {
    this.errors.unshift({
      ...error,
      timestamp: new Date()
    } as GP51Error & { timestamp: Date });

    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Use production logger instead of console
    logger.error('GP51', `${error.type}: ${error.message}`, error.details);

    // Store only critical errors to avoid database spam
    if (error.severity === 'critical') {
      this.storeCriticalError(error);
    }
  }

  private static async storeCriticalError(error: GP51Error): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase
        .from('gp51_connection_health')
        .insert({
          status: 'error',
          error_message: error.message,
          session_info: error.details
        });
    } catch (dbError) {
      logger.error('GP51', 'Failed to store critical error in database', dbError);
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
      Date.now() - (error as any).timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );
    return recentCriticalErrors.length > 0;
  }
}
