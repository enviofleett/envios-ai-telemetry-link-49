
export interface ImportError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class EnhancedImportErrorHandler {
  private errors: ImportError[] = [];

  addError(error: ImportError) {
    this.errors.push(error);
  }

  getErrors(): ImportError[] {
    return [...this.errors];
  }

  getCriticalErrors(): ImportError[] {
    return this.errors.filter(e => e.severity === 'critical');
  }

  hasCriticalErrors(): boolean {
    return this.getCriticalErrors().length > 0;
  }

  formatErrorsForUser(): string {
    if (this.errors.length === 0) return 'No errors detected';
    
    const criticalErrors = this.getCriticalErrors();
    if (criticalErrors.length > 0) {
      return `Critical errors detected: ${criticalErrors.map(e => e.message).join(', ')}`;
    }
    
    return `${this.errors.length} error(s) occurred during import`;
  }

  static parseApiError(error: any): ImportError {
    const timestamp = new Date();
    
    // Handle Supabase function errors
    if (error?.message?.includes('non-2xx status code')) {
      return {
        code: 'FUNCTION_ERROR',
        message: 'Edge function execution failed',
        details: 'The import service encountered an internal error. Please try again.',
        timestamp,
        severity: 'high'
      };
    }
    
    // Handle MD5 algorithm errors
    if (error?.message?.includes('Unrecognized algorithm')) {
      return {
        code: 'CRYPTO_ERROR',
        message: 'Authentication algorithm error',
        details: 'GP51 authentication failed due to cryptographic compatibility issue',
        timestamp,
        severity: 'critical'
      };
    }
    
    // Handle authentication errors
    if (error?.message?.includes('authentication') || error?.message?.includes('unauthorized')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        details: 'Unable to authenticate with GP51 API. Please check credentials.',
        timestamp,
        severity: 'high'
      };
    }
    
    // Handle network errors
    if (error?.message?.includes('fetch') || error?.message?.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        details: 'Unable to connect to GP51 API. Please check your internet connection.',
        timestamp,
        severity: 'medium'
      };
    }
    
    // Handle timeout errors
    if (error?.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Request timeout',
        details: 'GP51 API request timed out. The service may be temporarily unavailable.',
        timestamp,
        severity: 'medium'
      };
    }
    
    // Generic error fallback
    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'An unknown error occurred',
      details: 'Please contact support if this error persists',
      timestamp,
      severity: 'medium'
    };
  }

  static getRecoveryRecommendation(error: ImportError): string {
    switch (error.code) {
      case 'CRYPTO_ERROR':
        return 'This error has been fixed in the latest update. Please try again.';
      case 'AUTH_ERROR':
        return 'Please verify your GP51 credentials in the settings and test the connection again.';
      case 'NETWORK_ERROR':
        return 'Check your internet connection and try again. If the problem persists, GP51 servers may be down.';
      case 'TIMEOUT_ERROR':
        return 'The request took too long. Please try again in a few minutes.';
      case 'FUNCTION_ERROR':
        return 'The import service experienced an internal error. Please try again or contact support.';
      default:
        return 'Please try again. If the error persists, contact support with the error details.';
    }
  }

  clear() {
    this.errors = [];
  }
}

export const enhancedImportErrorHandler = new EnhancedImportErrorHandler();
