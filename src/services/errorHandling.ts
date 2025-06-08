interface ErrorReport {
  error: Error;
  context: string;
  userId?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

class ErrorHandlingService {
  private errors: ErrorReport[] = [];
  private maxErrors = 1000;

  logError(
    error: Error, 
    context: string, 
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: Record<string, any>
  ): void {
    const errorReport: ErrorReport = {
      error,
      context,
      timestamp: new Date().toISOString(),
      severity,
      metadata
    };

    // Add to local storage
    this.errors.push(errorReport);
    
    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log to console based on severity
    const logMethod = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    console[logMethod](`[${severity.toUpperCase()}] ${context}:`, error, metadata);

    // In production, send critical errors to monitoring service
    if (severity === 'critical') {
      this.sendToMonitoring(errorReport);
    }
  }

  getRecentErrors(count: number = 50): ErrorReport[] {
    return this.errors.slice(-count);
  }

  getErrorsByContext(context: string): ErrorReport[] {
    return this.errors.filter(error => error.context.includes(context));
  }

  getCriticalErrors(): ErrorReport[] {
    return this.errors.filter(error => error.severity === 'critical');
  }

  clearErrors(): void {
    this.errors = [];
  }

  private async sendToMonitoring(errorReport: ErrorReport): Promise<void> {
    // In production, this would send to a monitoring service like Sentry
    console.error('CRITICAL ERROR - Would send to monitoring:', errorReport);
  }

  // Global error handler
  setupGlobalErrorHandling(): void {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(
        new Error(event.reason),
        'Unhandled Promise Rejection',
        'high',
        { reason: event.reason }
      );
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.logError(
        event.error || new Error(event.message),
        'Global Error',
        'high',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });
  }
}

export const errorHandler = new ErrorHandlingService();

// Setup global error handling
errorHandler.setupGlobalErrorHandling();
