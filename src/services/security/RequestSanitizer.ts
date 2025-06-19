
import { SecurityService } from './SecurityService';

interface SanitizationResult {
  sanitized: any;
  warnings: string[];
  blocked: boolean;
  reason?: string;
}

interface SanitizationConfig {
  strictMode?: boolean;
  allowedFields?: string[];
  blockedFields?: string[];
  maxStringLength?: number;
  maxObjectDepth?: number;
}

export class RequestSanitizer {
  private static securityService = SecurityService;

  // Fix the function signature to match usage
  static sanitizeRequest(
    request: any, 
    config: SanitizationConfig = {}
  ): SanitizationResult {
    const warnings: string[] = [];
    let sanitized = { ...request };
    let blocked = false;
    let reason: string | undefined;

    try {
      // Sanitize each field
      for (const [key, value] of Object.entries(request)) {
        if (typeof value === 'string') {
          const validation = this.securityService.validateInput(value, 'text');
          if (!validation.isValid) {
            warnings.push(`Field ${key}: ${validation.error}`);
            if (config.strictMode) {
              blocked = true;
              reason = `Blocked due to invalid field: ${key}`;
              break;
            }
          } else {
            sanitized[key] = validation.sanitized;
          }
        }
      }

      // Log sanitization results
      if (warnings.length > 0) {
        this.securityService.logSecurityEvent({
          type: 'input_validation',
          severity: warnings.length > 3 ? 'medium' : 'low',
          description: 'Request sanitization completed with warnings',
          additionalData: {
            endpoint: 'unknown',
            method: 'unknown',
            fieldsProcessed: Object.keys(request),
            warningsCount: warnings.length,
            warnings: warnings.slice(0, 5) // Limit to first 5 warnings
          }
        });
      }

      return {
        sanitized,
        warnings,
        blocked,
        reason
      };

    } catch (error) {
      this.securityService.logSecurityEvent({
        type: 'input_validation',
        severity: 'high',
        description: 'Request sanitization failed',
        additionalData: {
          endpoint: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        sanitized: {},
        warnings: ['Sanitization failed'],
        blocked: true,
        reason: 'Internal sanitization error'
      };
    }
  }

  static redactSensitiveData(data: any, sensitiveFields: string[] = []): any {
    const defaultSensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    const fieldsToRedact = [...defaultSensitiveFields, ...sensitiveFields];
    
    const redacted = { ...data };
    const redactedFields: string[] = [];

    for (const field of fieldsToRedact) {
      if (redacted[field]) {
        redacted[field] = '[REDACTED]';
        redactedFields.push(field);
      }
    }

    if (redactedFields.length > 0) {
      this.securityService.logSecurityEvent({
        type: 'input_validation',
        severity: 'low',
        description: 'Sensitive data redacted from request',
        additionalData: {
          endpoint: 'unknown',
          redactedFields
        }
      });
    }

    return redacted;
  }

  static validateAndSanitize(input: any, config: SanitizationConfig = {}): SanitizationResult {
    try {
      // First sanitize
      const sanitizationResult = this.sanitizeRequest(input, config);
      
      if (sanitizationResult.blocked) {
        return sanitizationResult;
      }

      // Then redact sensitive data
      const redacted = this.redactSensitiveData(sanitizationResult.sanitized);

      return {
        ...sanitizationResult,
        sanitized: redacted
      };

    } catch (error) {
      this.securityService.logSecurityEvent({
        type: 'input_validation',
        severity: 'medium',
        description: 'Validation and sanitization process failed',
        additionalData: {
          endpoint: 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        sanitized: {},
        warnings: ['Validation failed'],
        blocked: true,
        reason: 'Validation process error'
      };
    }
  }
}
