
import { supabase } from '@/integrations/supabase/client';

export interface ErrorReport {
  errorType: string;
  errorSeverity: 'low' | 'medium' | 'high' | 'critical';
  errorMessage: string;
  errorSource: 'gp51_sync' | 'database' | 'api' | 'ui' | 'auth';
  errorStack?: string;
  userId?: string;
  sessionId?: string;
  errorContext?: Record<string, any>;
}

export interface ErrorTrackingMetrics {
  totalErrors: number;
  errorsBySeverity: Record<string, number>;
  errorsBySource: Record<string, number>;
  recentErrors: any[];
  errorTrends: any[];
}

export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;

  static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  async reportError(error: ErrorReport): Promise<void> {
    console.error(`🚨 Error Tracked [${error.errorSeverity.toUpperCase()}]:`, error.errorMessage);
    
    this.errorQueue.push(error);
    
    if (!this.isProcessing) {
      await this.processErrorQueue();
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

      for (const errorReport of errorsToProcess) {
        await this.storeError(errorReport);
      }
    } catch (processingError) {
      console.error('❌ Failed to process error queue:', processingError);
      // Re-add errors to queue if processing failed
      this.errorQueue.unshift(...this.errorQueue);
    } finally {
      this.isProcessing = false;
    }
  }

  private async storeError(error: ErrorReport): Promise<void> {
    try {
      // Check if this error already exists (for grouping)
      const { data: existingError } = await supabase
        .from('error_tracking_logs')
        .select('*')
        .eq('error_type', error.errorType)
        .eq('error_message', error.errorMessage)
        .eq('error_source', error.errorSource)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .maybeSingle();

      if (existingError) {
        // Update existing error occurrence count
        await supabase
          .from('error_tracking_logs')
          .update({
            occurrence_count: existingError.occurrence_count + 1,
            last_occurred_at: new Date().toISOString()
          })
          .eq('id', existingError.id);
      } else {
        // Create new error log entry
        await supabase
          .from('error_tracking_logs')
          .insert({
            error_type: error.errorType,
            error_severity: error.errorSeverity,
            error_message: error.errorMessage,
            error_source: error.errorSource,
            error_stack: error.errorStack,
            user_id: error.userId,
            session_id: error.sessionId,
            error_context: error.errorContext || {}
          });
      }
    } catch (dbError) {
      console.error('❌ Failed to store error in database:', dbError);
    }
  }

  async getErrorMetrics(): Promise<ErrorTrackingMetrics> {
    try {
      const { data: errors, error } = await supabase
        .from('error_tracking_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalErrors = errors?.length || 0;
      
      const errorsBySeverity = errors?.reduce((acc, err) => {
        acc[err.error_severity] = (acc[err.error_severity] || 0) + err.occurrence_count;
        return acc;
      }, {} as Record<string, number>) || {};

      const errorsBySource = errors?.reduce((acc, err) => {
        acc[err.error_source] = (acc[err.error_source] || 0) + err.occurrence_count;
        return acc;
      }, {} as Record<string, number>) || {};

      const recentErrors = errors?.slice(0, 10) || [];

      return {
        totalErrors,
        errorsBySeverity,
        errorsBySource,
        recentErrors,
        errorTrends: [] // TODO: Implement trend analysis
      };
    } catch (error) {
      console.error('❌ Failed to get error metrics:', error);
      return {
        totalErrors: 0,
        errorsBySeverity: {},
        errorsBySource: {},
        recentErrors: [],
        errorTrends: []
      };
    }
  }

  async resolveError(errorId: string, resolutionNotes: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_tracking_logs')
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: (await supabase.auth.getUser()).data.user?.id,
          resolution_notes: resolutionNotes
        })
        .eq('id', errorId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Failed to resolve error:', error);
      throw error;
    }
  }
}

export const errorTrackingService = ErrorTrackingService.getInstance();
