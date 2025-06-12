import { useToast } from '@/hooks/use-toast';

export interface ErrorContext {
  service: string;
  operation: string;
  vehicleId?: string;
  timestamp: Date;
  userFacing: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class ErrorHandlingService {
  private static defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2
  };

  static async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...this.defaultRetryConfig, ...retryConfig };
    let lastError: Error;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
            config.maxDelay
          );
          console.log(`🔄 Retrying ${context.service}.${context.operation} (attempt ${attempt + 1}/${config.maxRetries + 1}) after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const result = await operation();
        
        if (attempt > 0) {
          console.log(`✅ ${context.service}.${context.operation} succeeded on attempt ${attempt + 1}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        console.error(`❌ ${context.service}.${context.operation} failed (attempt ${attempt + 1}/${config.maxRetries + 1}):`, lastError.message);
        
        // Don't retry on certain types of errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }
        
        // If this is the last attempt, don't wait
        if (attempt === config.maxRetries) {
          break;
        }
      }
    }
    
    // All retries failed
    this.handleError(lastError!, context);
    throw lastError!;
  }

  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    fallbackValue?: T
  ): Promise<T | undefined> {
    try {
      return await operation();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)), context);
      return fallbackValue;
    }
  }

  private static isNonRetryableError(error: Error): boolean {
    const nonRetryableMessages = [
      'authentication failed',
      'unauthorized',
      'forbidden',
      'invalid credentials',
      'bad request',
      'not found'
    ];
    
    const message = error.message.toLowerCase();
    return nonRetryableMessages.some(msg => message.includes(msg));
  }

  private static handleError(error: Error, context: ErrorContext): void {
    // Log the error with context
    console.error(`🚨 Error in ${context.service}.${context.operation}:`, {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: context.timestamp
    });

    // Store error for potential reporting
    this.storeError(error, context);

    // Show user notification if this is a user-facing error
    if (context.userFacing) {
      this.showUserNotification(error, context);
    }
  }

  private static storeError(error: Error, context: ErrorContext): void {
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        service: context.service,
        operation: context.operation,
        vehicleId: context.vehicleId,
        timestamp: context.timestamp.toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      // Store in localStorage for now (could be enhanced to send to backend)
      const existingLogs = JSON.parse(localStorage.getItem('error-logs') || '[]');
      existingLogs.push(errorLog);
      
      // Keep only last 100 errors
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('error-logs', JSON.stringify(existingLogs));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }
  }

  private static showUserNotification(error: Error, context: ErrorContext): void {
    // This is a simplified implementation - in a real hook we'd use the toast from context
    console.error('User notification would be shown:', {
      title: `${context.service} Error`,
      description: this.getUserFriendlyMessage(error, context),
      variant: 'destructive'
    });
  }

  private static getUserFriendlyMessage(error: Error, context: ErrorContext): string {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network connection problem. Please check your internet connection and try again.';
    }
    
    if (message.includes('authentication') || message.includes('unauthorized')) {
      return 'Authentication failed. Please check your GP51 credentials.';
    }
    
    if (message.includes('timeout')) {
      return 'The operation timed out. Please try again.';
    }
    
    if (context.service === 'gp51DataService') {
      return 'Unable to fetch vehicle data from GP51. Please try again later.';
    }
    
    if (context.service === 'reportsApi') {
      return 'Unable to generate report. Please try again later.';
    }
    
    if (context.service === 'analyticsService') {
      return 'Unable to calculate analytics. Please try again later.';
    }
    
    return 'An unexpected error occurred. Please try again later.';
  }

  static getErrorLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('error-logs') || '[]');
    } catch {
      return [];
    }
  }

  static clearErrorLogs(): void {
    localStorage.removeItem('error-logs');
  }
}

// Helper hook for components to use error handling with toast
export const useErrorHandling = () => {
  const { toast } = useToast();
  
  const withErrorNotification = async <T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'timestamp' | 'userFacing'>,
    fallbackValue?: T
  ): Promise<T | undefined> => {
    try {
      return await operation();
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));
      const fullContext: ErrorContext = {
        ...context,
        timestamp: new Date(),
        userFacing: true
      };
      
      // Log the error
      console.error(`🚨 Error in ${context.service}.${context.operation}:`, errorInstance.message);
      
      // Show user-friendly toast
      toast({
        title: `${context.service} Error`,
        description: ErrorHandlingService['getUserFriendlyMessage'](errorInstance, fullContext),
        variant: 'destructive'
      });
      
      return fallbackValue;
    }
  };

  const withRetryAndNotification = async <T>(
    operation: () => Promise<T>,
    context: Omit<ErrorContext, 'timestamp' | 'userFacing'>,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> => {
    const fullContext: ErrorContext = {
      ...context,
      timestamp: new Date(),
      userFacing: true
    };
    
    try {
      return await ErrorHandlingService.withRetry(operation, fullContext, retryConfig);
    } catch (error) {
      const errorInstance = error instanceof Error ? error : new Error(String(error));
      
      toast({
        title: `${context.service} Error`,
        description: ErrorHandlingService['getUserFriendlyMessage'](errorInstance, fullContext),
        variant: 'destructive'
      });
      
      throw error;
    }
  };

  return {
    withErrorNotification,
    withRetryAndNotification
  };
};
