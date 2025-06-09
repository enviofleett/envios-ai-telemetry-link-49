
export interface DetailedError {
  code: string;
  message: string;
  details: string;
  suggestions: string[];
  category: 'network' | 'authentication' | 'configuration' | 'api' | 'validation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  context?: Record<string, any>;
}

export class GP51ErrorHandler {
  static createDetailedError(error: any, context?: Record<string, any>): DetailedError {
    const timestamp = new Date().toISOString();
    
    // Network errors
    if (error.message?.includes('Network error') || error.message?.includes('fetch')) {
      return {
        code: 'GP51_NETWORK_ERROR',
        message: 'Unable to connect to GP51 API',
        details: 'The system cannot establish a connection to the GP51 API server. This could be due to network connectivity issues, incorrect API URL, or server unavailability.',
        suggestions: [
          'Verify your internet connection',
          'Check if the GP51 API URL is correct',
          'Try using the legacy URL: https://www.gps51.com/webapi',
          'Contact your GP51 provider if the issue persists'
        ],
        category: 'network',
        severity: 'high',
        timestamp,
        context
      };
    }

    // Authentication errors
    if (error.message?.includes('authentication failed') || error.message?.includes('Invalid')) {
      return {
        code: 'GP51_AUTH_ERROR',
        message: 'GP51 authentication failed',
        details: 'The provided GP51 username or password is incorrect, or your account may be locked or expired.',
        suggestions: [
          'Double-check your GP51 username and password',
          'Ensure your GP51 account is active',
          'Contact your GP51 administrator if credentials are correct',
          'Try logging into GP51 web interface directly to verify credentials'
        ],
        category: 'authentication',
        severity: 'high',
        timestamp,
        context
      };
    }

    // URL format errors
    if (error.message?.includes('URL format') || error.message?.includes('Invalid GP51 API URL')) {
      return {
        code: 'GP51_URL_ERROR',
        message: 'Invalid GP51 API URL format',
        details: 'The provided GP51 API URL is not in a valid format or cannot be reached.',
        suggestions: [
          'Use a complete URL including protocol (https://)',
          'Common formats: https://www.gps51.com or https://api.gps51.com',
          'Remove any trailing paths like /webapi (added automatically)',
          'Contact your GP51 provider for the correct API URL'
        ],
        category: 'configuration',
        severity: 'medium',
        timestamp,
        context
      };
    }

    // API response errors
    if (error.message?.includes('API returned') || error.message?.includes('empty response')) {
      return {
        code: 'GP51_API_ERROR',
        message: 'GP51 API response error',
        details: 'The GP51 API returned an unexpected or invalid response. This may indicate a server issue or API version incompatibility.',
        suggestions: [
          'Try again in a few minutes',
          'Verify the GP51 API URL is correct',
          'Check if GP51 services are experiencing issues',
          'Contact technical support if the problem persists'
        ],
        category: 'api',
        severity: 'medium',
        timestamp,
        context
      };
    }

    // Session errors
    if (error.message?.includes('session') || error.message?.includes('token')) {
      return {
        code: 'GP51_SESSION_ERROR',
        message: 'GP51 session management error',
        details: 'There was an issue managing your GP51 session. This could be due to expired tokens or session conflicts.',
        suggestions: [
          'Clear existing sessions and re-authenticate',
          'Check if multiple users are using the same GP51 account',
          'Verify GP51 account permissions',
          'Try logging out and back in'
        ],
        category: 'authentication',
        severity: 'medium',
        timestamp,
        context
      };
    }

    // Generic fallback
    return {
      code: 'GP51_UNKNOWN_ERROR',
      message: 'Unexpected GP51 error',
      details: error.message || 'An unexpected error occurred while connecting to GP51.',
      suggestions: [
        'Try the operation again',
        'Check your internet connection',
        'Verify all credentials are correct',
        'Contact support if the issue persists'
      ],
      category: 'api',
      severity: 'medium',
      timestamp,
      context
    };
  }

  static logError(error: DetailedError, additionalContext?: Record<string, any>): void {
    console.error(`🚨 GP51 Error [${error.severity.toUpperCase()}]:`, {
      code: error.code,
      message: error.message,
      details: error.details,
      category: error.category,
      timestamp: error.timestamp,
      context: { ...error.context, ...additionalContext }
    });
  }

  static formatErrorForClient(error: DetailedError): any {
    return {
      success: false,
      error: error.message,
      details: error.details,
      code: error.code,
      suggestions: error.suggestions,
      category: error.category,
      severity: error.severity,
      timestamp: error.timestamp
    };
  }
}
