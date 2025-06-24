import { supabase } from '@/integrations/supabase/client';

export interface GP51ErrorReport {
  type: 'authentication' | 'connectivity' | 'api' | 'session' | 'validation';
  message: string;
  details?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp?: Date; // Made optional since it's added automatically
  username?: string;
  endpoint?: string;
  stackTrace?: string;
}

export class GP51ErrorReporter {
  private static instance: GP51ErrorReporter;
  private errorQueue: GP51ErrorReport[] = [];
  private isProcessing = false;

  static getInstance(): GP51ErrorReporter {
    if (!GP51ErrorReporter.instance) {
      GP51ErrorReporter.instance = new GP51ErrorReporter();
    }
    return GP51ErrorReporter.instance;
  }

  reportError(error: GP51ErrorReport): void {
    console.error(`🚨 GP51 Error [${error.severity.toUpperCase()}]:`, error.message, error.details);
    
    // Add to queue for processing
    this.errorQueue.push({
      ...error,
      stackTrace: error.stackTrace || new Error().stack,
      timestamp: error.timestamp || new Date() // Add timestamp if not provided
    });

    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processErrorQueue();
    }
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const errorsToProcess = [...this.errorQueue];
      this.errorQueue = [];

      // Log errors to console for immediate visibility
      errorsToProcess.forEach(error => {
        this.logErrorToConsole(error);
      });

      // Optionally save to database for persistence
      await this.saveErrorsToDatabase(errorsToProcess);

    } catch (processingError) {
      console.error('❌ Failed to process error queue:', processingError);
      // Re-add errors to queue if processing failed
      this.errorQueue.unshift(...this.errorQueue);
    } finally {
      this.isProcessing = false;
    }
  }

  private logErrorToConsole(error: GP51ErrorReport): void {
    const timestamp = error.timestamp!.toISOString();
    const severity = error.severity.toUpperCase();
    
    console.group(`🚨 GP51 Error Report [${severity}] - ${timestamp}`);
    console.error(`Type: ${error.type}`);
    console.error(`Message: ${error.message}`);
    
    if (error.username) {
      console.error(`Username: ${error.username}`);
    }
    
    if (error.endpoint) {
      console.error(`Endpoint: ${error.endpoint}`);
    }
    
    if (error.details) {
      console.error('Details:', error.details);
    }
    
    if (error.stackTrace) {
      console.error('Stack Trace:', error.stackTrace);
    }
    
    console.groupEnd();
  }

  private async saveErrorsToDatabase(errors: GP51ErrorReport[]): Promise<void> {
    try {
      // This could be expanded to save errors to a dedicated error log table
      console.log(`📝 Logging ${errors.length} GP51 errors for analysis`);
      
      // For now, we'll just ensure they're properly logged
      // In the future, you could create an error_logs table and save them there
      
    } catch (error) {
      console.error('❌ Failed to save errors to database:', error);
    }
  }

  getErrorSummary(): { total: number; bySeverity: Record<string, number>; byType: Record<string, number> } {
    const summary = {
      total: this.errorQueue.length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>
    };

    this.errorQueue.forEach(error => {
      summary.bySeverity[error.severity] = (summary.bySeverity[error.severity] || 0) + 1;
      summary.byType[error.type] = (summary.byType[error.type] || 0) + 1;
    });

    return summary;
  }

  clearErrorQueue(): void {
    console.log('🧹 Clearing GP51 error queue');
    this.errorQueue = [];
  }
}

export const gp51ErrorReporter = GP51ErrorReporter.getInstance();
