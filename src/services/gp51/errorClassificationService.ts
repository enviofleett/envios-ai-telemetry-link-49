
export interface GP51Error {
  type: 'network' | 'authentication' | 'api' | 'data' | 'rate_limit' | 'timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  code?: string;
  message: string;
  userMessage: string;
  recoverable: boolean;
  retryAfter?: number;
  suggestedAction?: string;
}

export class ErrorClassificationService {
  static classifyError(error: any, context?: string): GP51Error {
    // Network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return {
        type: 'network',
        severity: 'high',
        message: error.message || 'Network connection failed',
        userMessage: 'Unable to connect to GP51 servers. Please check your internet connection.',
        recoverable: true,
        retryAfter: 5000,
        suggestedAction: 'Check internet connection and try again'
      };
    }

    // Authentication errors
    if (error.message?.includes('token') || error.message?.includes('auth') || error.message?.includes('login')) {
      return {
        type: 'authentication',
        severity: 'high',
        message: error.message,
        userMessage: 'Authentication failed. Please re-authenticate with GP51.',
        recoverable: true,
        suggestedAction: 'Go to Admin Settings and re-authenticate GP51 credentials'
      };
    }

    // GP51 API specific errors
    if (error.message?.includes('global_error_action action not found')) {
      return {
        type: 'api',
        severity: 'critical',
        code: 'INVALID_ACTION',
        message: 'Invalid GP51 API action',
        userMessage: 'GP51 API configuration error. Please contact support.',
        recoverable: false,
        suggestedAction: 'Contact technical support'
      };
    }

    // Rate limiting
    if (error.message?.includes('rate limit') || error.status === 429) {
      return {
        type: 'rate_limit',
        severity: 'medium',
        message: 'API rate limit exceeded',
        userMessage: 'Too many requests. Please wait a moment before trying again.',
        recoverable: true,
        retryAfter: 30000,
        suggestedAction: 'Wait 30 seconds and try again'
      };
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        type: 'timeout',
        severity: 'medium',
        message: 'Request timeout',
        userMessage: 'Request took too long. The GP51 servers may be slow.',
        recoverable: true,
        retryAfter: 10000,
        suggestedAction: 'Try again in a few moments'
      };
    }

    // Data parsing errors
    if (error.name === 'SyntaxError' && error.message?.includes('JSON')) {
      return {
        type: 'data',
        severity: 'medium',
        message: 'Invalid response format from GP51',
        userMessage: 'Received invalid data from GP51. This may be a temporary issue.',
        recoverable: true,
        retryAfter: 5000,
        suggestedAction: 'Try again in a few moments'
      };
    }

    // Generic fallback
    return {
      type: 'api',
      severity: 'medium',
      message: error.message || 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      recoverable: true,
      retryAfter: 5000,
      suggestedAction: 'Try again or contact support if the issue persists'
    };
  }

  static getRecoveryStrategy(error: GP51Error): {
    shouldRetry: boolean;
    retryDelay: number;
    maxRetries: number;
    action: 'retry' | 'reauthenticate' | 'fallback' | 'abort';
  } {
    switch (error.type) {
      case 'network':
        return {
          shouldRetry: true,
          retryDelay: 5000,
          maxRetries: 3,
          action: 'retry'
        };

      case 'authentication':
        return {
          shouldRetry: false,
          retryDelay: 0,
          maxRetries: 0,
          action: 'reauthenticate'
        };

      case 'rate_limit':
        return {
          shouldRetry: true,
          retryDelay: error.retryAfter || 30000,
          maxRetries: 2,
          action: 'retry'
        };

      case 'timeout':
        return {
          shouldRetry: true,
          retryDelay: 10000,
          maxRetries: 2,
          action: 'retry'
        };

      case 'data':
        return {
          shouldRetry: true,
          retryDelay: 5000,
          maxRetries: 2,
          action: 'retry'
        };

      case 'api':
        if (error.recoverable) {
          return {
            shouldRetry: true,
            retryDelay: 5000,
            maxRetries: 1,
            action: 'retry'
          };
        }
        return {
          shouldRetry: false,
          retryDelay: 0,
          maxRetries: 0,
          action: 'abort'
        };

      default:
        return {
          shouldRetry: false,
          retryDelay: 0,
          maxRetries: 0,
          action: 'abort'
        };
    }
  }
}
