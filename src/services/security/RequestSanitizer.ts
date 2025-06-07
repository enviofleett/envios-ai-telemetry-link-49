
import { SecurityService } from './SecurityService';

export interface SanitizedRequest {
  sanitizedData: Record<string, any>;
  warnings: string[];
  blocked: boolean;
  blockReason?: string;
}

export interface GP51RequestContext {
  endpoint: string;
  method: string;
  userRole?: string;
  userId?: string;
  ipAddress?: string;
}

export class RequestSanitizer {
  private static readonly SENSITIVE_FIELDS = [
    'password', 'token', 'api_key', 'secret', 'credential'
  ];

  private static readonly GP51_ENDPOINTS = {
    'login': {
      requiredFields: ['username', 'password'],
      optionalFields: ['apiUrl'],
      validationRules: {
        username: 'username',
        password: 'text',
        apiUrl: 'api_endpoint'
      }
    },
    'querymonitorlist': {
      requiredFields: ['token'],
      optionalFields: ['username'],
      validationRules: {
        token: 'gp51_token',
        username: 'username'
      }
    },
    'lastposition': {
      requiredFields: ['token', 'deviceids'],
      optionalFields: ['lastquerypositiontime'],
      validationRules: {
        token: 'gp51_token',
        deviceids: 'text',
        lastquerypositiontime: 'text'
      }
    },
    'adduser': {
      requiredFields: ['token', 'username', 'password'],
      optionalFields: ['email', 'usertype', 'gp51Username'],
      validationRules: {
        token: 'gp51_token',
        username: 'username',
        password: 'text',
        email: 'email',
        usertype: 'text',
        gp51Username: 'username'
      }
    },
    'chargedevices': {
      requiredFields: ['token', 'deviceids'],
      optionalFields: ['years', 'overduetime', 'free'],
      validationRules: {
        token: 'gp51_token',
        deviceids: 'text',
        years: 'text',
        overduetime: 'text',
        free: 'text'
      }
    }
  };

  static sanitizeGP51Request(
    data: Record<string, any>,
    context: GP51RequestContext
  ): SanitizedRequest {
    const warnings: string[] = [];
    const sanitizedData: Record<string, any> = {};
    
    try {
      // Get endpoint configuration
      const endpointConfig = this.GP51_ENDPOINTS[context.endpoint as keyof typeof this.GP51_ENDPOINTS];
      
      if (!endpointConfig) {
        return {
          sanitizedData: {},
          warnings: [`Unknown GP51 endpoint: ${context.endpoint}`],
          blocked: true,
          blockReason: 'Unknown endpoint'
        };
      }

      // Check required fields
      for (const field of endpointConfig.requiredFields) {
        if (!data[field]) {
          return {
            sanitizedData: {},
            warnings: [`Missing required field: ${field}`],
            blocked: true,
            blockReason: `Missing required field: ${field}`
          };
        }
      }

      // Validate and sanitize each field
      const allFields = [...endpointConfig.requiredFields, ...endpointConfig.optionalFields];
      
      for (const field of allFields) {
        if (data[field] !== undefined) {
          const validationType = endpointConfig.validationRules[field] as any;
          
          if (validationType) {
            const validation = SecurityService.validateInput(
              String(data[field]), 
              validationType,
              { operation: context.endpoint, userRole: context.userRole }
            );

            if (!validation.isValid) {
              warnings.push(`Invalid ${field}: ${validation.error}`);
              
              // Block request for critical validation failures
              if (validation.error?.includes('malicious') || validation.error?.includes('injection')) {
                return {
                  sanitizedData: {},
                  warnings,
                  blocked: true,
                  blockReason: `Security validation failed for ${field}`
                };
              }
              continue;
            }

            sanitizedData[field] = validation.sanitizedValue || data[field];
          } else {
            // Basic sanitization for fields without specific rules
            sanitizedData[field] = this.basicSanitize(data[field]);
          }
        }
      }

      // Check for unexpected fields
      for (const field in data) {
        if (!allFields.includes(field)) {
          warnings.push(`Unexpected field ignored: ${field}`);
        }
      }

      // Log the sanitization process
      SecurityService.logSecurityEvent({
        type: 'input_validation',
        severity: warnings.length > 0 ? 'medium' : 'low',
        description: `GP51 request sanitized for ${context.endpoint}`,
        userId: context.userId,
        ipAddress: context.ipAddress,
        additionalData: {
          endpoint: context.endpoint,
          method: context.method,
          fieldsProcessed: Object.keys(sanitizedData),
          warningsCount: warnings.length,
          warnings: warnings.slice(0, 5) // Limit logged warnings
        }
      });

      return {
        sanitizedData,
        warnings,
        blocked: false
      };

    } catch (error) {
      SecurityService.logSecurityEvent({
        type: 'input_validation',
        severity: 'high',
        description: 'Request sanitization failed',
        userId: context.userId,
        ipAddress: context.ipAddress,
        additionalData: {
          endpoint: context.endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        sanitizedData: {},
        warnings: ['Request sanitization failed'],
        blocked: true,
        blockReason: 'Internal sanitization error'
      };
    }
  }

  static sanitizeResponse(
    response: any,
    context: GP51RequestContext
  ): { sanitizedResponse: any; redactedFields: string[] } {
    const redactedFields: string[] = [];
    
    try {
      const sanitized = this.deepSanitizeObject(response, redactedFields);
      
      // Log response sanitization
      if (redactedFields.length > 0) {
        SecurityService.logSecurityEvent({
          type: 'input_validation',
          severity: 'low',
          description: 'GP51 response sanitized',
          userId: context.userId,
          additionalData: {
            endpoint: context.endpoint,
            redactedFields: redactedFields.slice(0, 10) // Limit logged fields
          }
        });
      }

      return {
        sanitizedResponse: sanitized,
        redactedFields
      };
    } catch (error) {
      SecurityService.logSecurityEvent({
        type: 'input_validation',
        severity: 'medium',
        description: 'Response sanitization failed',
        userId: context.userId,
        additionalData: {
          endpoint: context.endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        sanitizedResponse: { error: 'Response processing failed' },
        redactedFields: ['all']
      };
    }
  }

  private static deepSanitizeObject(obj: any, redactedFields: string[], path = ''): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj, path, redactedFields);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => 
        this.deepSanitizeObject(item, redactedFields, `${path}[${index}]`)
      );
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if field should be redacted
        if (this.shouldRedactField(key)) {
          sanitized[key] = '[REDACTED]';
          redactedFields.push(currentPath);
        } else {
          sanitized[key] = this.deepSanitizeObject(value, redactedFields, currentPath);
        }
      }
      
      return sanitized;
    }

    return obj;
  }

  private static shouldRedactField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return this.SENSITIVE_FIELDS.some(sensitive => 
      lowerFieldName.includes(sensitive)
    );
  }

  private static sanitizeString(str: string, path: string, redactedFields: string[]): string {
    // Check for sensitive patterns in strings
    if (this.containsSensitiveData(str)) {
      redactedFields.push(path);
      return '[REDACTED]';
    }

    // Basic XSS protection
    return str
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  private static containsSensitiveData(str: string): boolean {
    // Patterns that might indicate sensitive data
    const sensitivePatterns = [
      /[a-f0-9]{32,}/i, // Potential hashes or tokens
      /^\d{15,16}$/, // Credit card numbers
      /^\d{3}-\d{2}-\d{4}$/, // SSN pattern
      /password\s*[:=]\s*\S+/i,
      /token\s*[:=]\s*\S+/i,
      /key\s*[:=]\s*\S+/i
    ];

    return sensitivePatterns.some(pattern => pattern.test(str));
  }

  private static basicSanitize(value: any): any {
    if (typeof value === 'string') {
      return value
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .trim();
    }
    return value;
  }

  // Audit trail for sanitization actions
  static getSanitizationStats(hours = 24): {
    totalRequests: number;
    blockedRequests: number;
    warningsGenerated: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
  } {
    const events = SecurityService.getSecurityEvents({
      type: 'input_validation',
      hours
    });

    const requestEvents = events.filter(e => 
      e.description.includes('GP51 request sanitized') || 
      e.description.includes('Security validation failed')
    );

    const blockedEvents = events.filter(e => 
      e.description.includes('Security validation failed') ||
      e.description.includes('Request sanitization failed')
    );

    const warningEvents = events.filter(e => 
      e.additionalData?.warningsCount > 0
    );

    // Count endpoints
    const endpointCounts = new Map<string, number>();
    requestEvents.forEach(event => {
      const endpoint = event.additionalData?.endpoint;
      if (endpoint) {
        endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
      }
    });

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests: requestEvents.length,
      blockedRequests: blockedEvents.length,
      warningsGenerated: warningEvents.length,
      topEndpoints
    };
  }
}
