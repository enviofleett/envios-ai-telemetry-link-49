
import { SecurityService } from './SecurityService';

export interface SecureError {
  code: string;
  message: string;
  userMessage: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
  context?: Record<string, any>;
}

export interface ErrorContext {
  endpoint?: string;
  method?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export class ErrorHandler {
  private static readonly ERROR_CODES = {
    // Authentication & Authorization
    'AUTH_INVALID_CREDENTIALS': {
      userMessage: 'Invalid username or password',
      statusCode: 401,
      logLevel: 'medium' as const
    },
    'AUTH_TOKEN_EXPIRED': {
      userMessage: 'Session has expired. Please log in again',
      statusCode: 401,
      logLevel: 'low' as const
    },
    'AUTH_INSUFFICIENT_PERMISSIONS': {
      userMessage: 'You do not have permission to perform this action',
      statusCode: 403,
      logLevel: 'medium' as const
    },
    'AUTH_ACCOUNT_LOCKED': {
      userMessage: 'Account temporarily locked due to multiple failed attempts',
      statusCode: 423,
      logLevel: 'high' as const
    },

    // Rate Limiting
    'RATE_LIMIT_EXCEEDED': {
      userMessage: 'Too many requests. Please try again later',
      statusCode: 429,
      logLevel: 'medium' as const
    },
    'RATE_LIMIT_IP_BLOCKED': {
      userMessage: 'Your IP address has been temporarily blocked',
      statusCode: 429,
      logLevel: 'high' as const
    },

    // Input Validation
    'VALIDATION_FAILED': {
      userMessage: 'Invalid input provided',
      statusCode: 400,
      logLevel: 'low' as const
    },
    'VALIDATION_MALICIOUS_INPUT': {
      userMessage: 'Request rejected for security reasons',
      statusCode: 400,
      logLevel: 'critical' as const
    },

    // GP51 API Errors
    'GP51_CONNECTION_FAILED': {
      userMessage: 'Unable to connect to GPS tracking service',
      statusCode: 502,
      logLevel: 'high' as const
    },
    'GP51_AUTHENTICATION_FAILED': {
      userMessage: 'GPS service authentication failed',
      statusCode: 401,
      logLevel: 'high' as const
    },
    'GP51_RATE_LIMITED': {
      userMessage: 'GPS service is temporarily unavailable',
      statusCode: 503,
      logLevel: 'medium' as const
    },
    'GP51_INVALID_RESPONSE': {
      userMessage: 'Invalid response from GPS service',
      statusCode: 502,
      logLevel: 'medium' as const
    },

    // System Errors
    'DATABASE_ERROR': {
      userMessage: 'A database error occurred. Please try again',
      statusCode: 500,
      logLevel: 'critical' as const
    },
    'SYSTEM_UNAVAILABLE': {
      userMessage: 'System temporarily unavailable',
      statusCode: 503,
      logLevel: 'critical' as const
    },
    'CONFIGURATION_ERROR': {
      userMessage: 'System configuration error',
      statusCode: 500,
      logLevel: 'critical' as const
    },

    // Generic
    'INTERNAL_ERROR': {
      userMessage: 'An internal error occurred. Please try again',
      statusCode: 500,
      logLevel: 'high' as const
    },
    'NOT_FOUND': {
      userMessage: 'Requested resource not found',
      statusCode: 404,
      logLevel: 'low' as const
    },
    'METHOD_NOT_ALLOWED': {
      userMessage: 'Method not allowed',
      statusCode: 405,
      logLevel: 'medium' as const
    }
  };

  private static readonly SENSITIVE_ERROR_PATTERNS = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /credential/i,
    /database/i,
    /internal/i,
    /stack trace/i,
    /file path/i,
    /environment/i,
    /config/i
  ];

  static createSecureError(
    code: string,
    originalError?: Error | string,
    context?: ErrorContext,
    additionalData?: Record<string, any>
  ): SecureError {
    const errorConfig = this.ERROR_CODES[code as keyof typeof this.ERROR_CODES];
    
    if (!errorConfig) {
      console.warn(`Unknown error code: ${code}`);
      return this.createSecureError('INTERNAL_ERROR', originalError, context, additionalData);
    }

    const timestamp = new Date().toISOString();
    const requestId = context?.requestId || this.generateRequestId();

    // Sanitize the original error message
    const sanitizedMessage = this.sanitizeErrorMessage(
      originalError instanceof Error ? originalError.message : (originalError || 'Unknown error')
    );

    const secureError: SecureError = {
      code,
      message: sanitizedMessage,
      userMessage: errorConfig.userMessage,
      statusCode: errorConfig.statusCode,
      timestamp,
      requestId,
      context: this.sanitizeContext(context)
    };

    // Log the error with appropriate severity
    SecurityService.logSecurityEvent({
      type: this.getEventTypeForError(code),
      severity: errorConfig.logLevel,
      description: `Error occurred: ${code}`,
      userId: context?.userId,
      ipAddress: context?.ipAddress,
      additionalData: {
        errorCode: code,
        endpoint: context?.endpoint,
        method: context?.method,
        requestId,
        sanitizedMessage,
        originalErrorType: originalError instanceof Error ? originalError.constructor.name : 'string',
        additionalData: this.sanitizeAdditionalData(additionalData)
      }
    });

    return secureError;
  }

  static handleGP51Error(
    error: any,
    context: ErrorContext,
    operation: string
  ): SecureError {
    let errorCode = 'GP51_CONNECTION_FAILED';
    let additionalData: Record<string, any> = { operation };

    // Analyze GP51 error to determine appropriate error code
    if (error?.status !== undefined) {
      additionalData.gp51Status = error.status;
      
      if (error.status === 0) {
        // GP51 success but might be an authentication issue
        errorCode = 'GP51_AUTHENTICATION_FAILED';
      } else if (error.status === 429) {
        errorCode = 'GP51_RATE_LIMITED';
      } else if (error.status >= 400 && error.status < 500) {
        errorCode = 'GP51_AUTHENTICATION_FAILED';
      } else if (error.status >= 500) {
        errorCode = 'GP51_CONNECTION_FAILED';
      }
    }

    // Check for specific GP51 error messages
    const errorMessage = error?.cause || error?.message || error?.error || '';
    if (errorMessage.toLowerCase().includes('authentication')) {
      errorCode = 'GP51_AUTHENTICATION_FAILED';
    } else if (errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('limit')) {
      errorCode = 'GP51_RATE_LIMITED';
    } else if (errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('malformed')) {
      errorCode = 'GP51_INVALID_RESPONSE';
    }

    additionalData.gp51Message = this.sanitizeErrorMessage(errorMessage);

    return this.createSecureError(errorCode, error, context, additionalData);
  }

  static sanitizeErrorResponse(error: any): {
    sanitizedError: any;
    redactedFields: string[];
  } {
    const redactedFields: string[] = [];
    
    try {
      const sanitized = this.deepSanitizeError(error, redactedFields);
      
      return {
        sanitizedError: sanitized,
        redactedFields
      };
    } catch (sanitizationError) {
      console.error('Error sanitization failed:', sanitizationError);
      
      return {
        sanitizedError: {
          error: 'Error processing failed',
          code: 'SANITIZATION_FAILED',
          timestamp: new Date().toISOString()
        },
        redactedFields: ['all']
      };
    }
  }

  static createUserFriendlyResponse(secureError: SecureError): {
    error: {
      message: string;
      code: string;
      timestamp: string;
      requestId?: string;
    };
    statusCode: number;
  } {
    return {
      error: {
        message: secureError.userMessage,
        code: secureError.code,
        timestamp: secureError.timestamp,
        requestId: secureError.requestId
      },
      statusCode: secureError.statusCode
    };
  }

  static getErrorStats(hours = 24): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    errorTrends: Array<{ hour: string; count: number }>;
  } {
    const events = SecurityService.getSecurityEvents({ hours });
    const errorEvents = events.filter(e => 
      e.additionalData?.errorCode || 
      e.description.includes('Error occurred')
    );

    const errorsByCode: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const endpointCounts = new Map<string, number>();
    const hourlyErrors = new Map<string, number>();

    errorEvents.forEach(event => {
      // Count by error code
      const errorCode = event.additionalData?.errorCode;
      if (errorCode) {
        errorsByCode[errorCode] = (errorsByCode[errorCode] || 0) + 1;
      }

      // Count by severity
      errorsBySeverity[event.severity] = (errorsBySeverity[event.severity] || 0) + 1;

      // Count by endpoint
      const endpoint = event.additionalData?.endpoint;
      if (endpoint) {
        endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
      }

      // Count by hour
      const hour = new Date(event.timestamp).toISOString().substring(0, 13);
      hourlyErrors.set(hour, (hourlyErrors.get(hour) || 0) + 1);
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const errorTrends = Array.from(hourlyErrors.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return {
      totalErrors: errorEvents.length,
      errorsByCode,
      errorsBySeverity,
      topEndpoints,
      errorTrends
    };
  }

  private static sanitizeErrorMessage(message: string): string {
    let sanitized = message;

    // Remove sensitive information
    this.SENSITIVE_ERROR_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    // Remove file paths
    sanitized = sanitized.replace(/\/[^\s]+\.(js|ts|py|java|php)/g, '[FILE_PATH]');
    
    // Remove stack traces
    sanitized = sanitized.replace(/\s+at\s+.*$/gm, '');
    
    // Remove line numbers
    sanitized = sanitized.replace(/:\d+:\d+/g, ':XX:XX');
    
    // Limit length
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200) + '...';
    }

    return sanitized.trim();
  }

  private static sanitizeContext(context?: ErrorContext): Record<string, any> | undefined {
    if (!context) return undefined;

    const sanitized: Record<string, any> = {};

    // Only include safe context fields
    const safeFields = ['endpoint', 'method', 'requestId'];
    safeFields.forEach(field => {
      if (context[field as keyof ErrorContext]) {
        sanitized[field] = context[field as keyof ErrorContext];
      }
    });

    // Include user ID only if it's a valid UUID format
    if (context.userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(context.userId)) {
      sanitized.userId = context.userId;
    }

    // Sanitize IP address (remove last octet for privacy)
    if (context.ipAddress) {
      const parts = context.ipAddress.split('.');
      if (parts.length === 4) {
        sanitized.ipNetwork = `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
    }

    return sanitized;
  }

  private static sanitizeAdditionalData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;

    const sanitized: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      // Skip sensitive keys
      if (this.SENSITIVE_ERROR_PATTERNS.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
        return;
      }

      // Sanitize string values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeErrorMessage(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value && typeof value === 'object') {
        // Recursively sanitize objects (limited depth)
        sanitized[key] = this.sanitizeAdditionalData(value);
      } else {
        sanitized[key] = '[COMPLEX_VALUE]';
      }
    });

    return sanitized;
  }

  private static deepSanitizeError(error: any, redactedFields: string[], path = ''): any {
    if (error === null || error === undefined) {
      return error;
    }

    if (typeof error === 'string') {
      return this.sanitizeErrorMessage(error);
    }

    if (typeof error === 'number' || typeof error === 'boolean') {
      return error;
    }

    if (Array.isArray(error)) {
      return error.map((item, index) => 
        this.deepSanitizeError(item, redactedFields, `${path}[${index}]`)
      );
    }

    if (typeof error === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(error)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if field should be redacted
        if (this.SENSITIVE_ERROR_PATTERNS.some(pattern => pattern.test(key))) {
          sanitized[key] = '[REDACTED]';
          redactedFields.push(currentPath);
        } else {
          sanitized[key] = this.deepSanitizeError(value, redactedFields, currentPath);
        }
      }
      
      return sanitized;
    }

    return error;
  }

  private static getEventTypeForError(code: string): SecurityEvent['type'] {
    if (code.startsWith('AUTH_')) {
      return 'authentication';
    }
    if (code.startsWith('RATE_')) {
      return 'rate_limit';
    }
    if (code.startsWith('VALIDATION_')) {
      return 'input_validation';
    }
    return 'suspicious_activity';
  }

  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Configuration management
  static updateErrorConfig(code: string, config: Partial<typeof ErrorHandler.ERROR_CODES[keyof typeof ErrorHandler.ERROR_CODES]>): void {
    if (this.ERROR_CODES[code as keyof typeof this.ERROR_CODES]) {
      this.ERROR_CODES[code as keyof typeof this.ERROR_CODES] = {
        ...this.ERROR_CODES[code as keyof typeof this.ERROR_CODES],
        ...config
      };
      
      SecurityService.logSecurityEvent({
        type: 'authentication',
        severity: 'medium',
        description: `Error configuration updated for ${code}`,
        additionalData: { errorCode: code, changes: config }
      });
    }
  }
}
