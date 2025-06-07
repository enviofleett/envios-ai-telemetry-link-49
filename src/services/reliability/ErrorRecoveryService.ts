
import { ErrorHandler, SecureError, ErrorContext } from '../security/ErrorHandler';
import { retryService } from './RetryService';
import { degradationService } from './DegradationService';
import { circuitBreakerService } from './CircuitBreakerService';

export interface RecoveryAction {
  type: 'retry' | 'fallback' | 'escalate' | 'ignore';
  description: string;
  handler?: () => Promise<void>;
  maxAttempts?: number;
  delay?: number;
}

export interface RecoveryContext {
  errorCode: string;
  serviceName: string;
  operation: string;
  attemptCount: number;
  lastAttemptTime: number;
  recoveryActions: RecoveryAction[];
}

export interface AutoRecoveryResult {
  success: boolean;
  action: string;
  message: string;
  error?: Error;
}

export class ErrorRecoveryService {
  private static instance: ErrorRecoveryService;
  private recoveryStrategies = new Map<string, RecoveryAction[]>();
  private activeRecoveries = new Map<string, RecoveryContext>();

  static getInstance(): ErrorRecoveryService {
    if (!ErrorRecoveryService.instance) {
      ErrorRecoveryService.instance = new ErrorRecoveryService();
      ErrorRecoveryService.instance.initializeRecoveryStrategies();
    }
    return ErrorRecoveryService.instance;
  }

  private initializeRecoveryStrategies(): void {
    // GP51 Authentication Recovery
    this.recoveryStrategies.set('AUTH_TOKEN_EXPIRED', [
      {
        type: 'retry',
        description: 'Re-authenticate with GP51',
        maxAttempts: 3,
        delay: 1000,
        handler: async () => {
          // This will be implemented to trigger re-authentication
          console.log('Triggering GP51 re-authentication');
        }
      },
      {
        type: 'fallback',
        description: 'Use cached session if available'
      }
    ]);

    this.recoveryStrategies.set('GP51_CONNECTION_FAILED', [
      {
        type: 'retry',
        description: 'Retry with exponential backoff',
        maxAttempts: 5,
        delay: 2000
      },
      {
        type: 'fallback',
        description: 'Switch to degraded mode with cached data'
      },
      {
        type: 'escalate',
        description: 'Alert administrators and switch to offline mode'
      }
    ]);

    this.recoveryStrategies.set('GP51_RATE_LIMITED', [
      {
        type: 'retry',
        description: 'Wait and retry with increased delay',
        maxAttempts: 3,
        delay: 60000 // 1 minute
      },
      {
        type: 'fallback',
        description: 'Use cached position data'
      }
    ]);

    this.recoveryStrategies.set('DATABASE_ERROR', [
      {
        type: 'retry',
        description: 'Retry database operation',
        maxAttempts: 3,
        delay: 500
      },
      {
        type: 'fallback',
        description: 'Use in-memory cache'
      },
      {
        type: 'escalate',
        description: 'Alert database administrators'
      }
    ]);

    this.recoveryStrategies.set('VALIDATION_MALICIOUS_INPUT', [
      {
        type: 'ignore',
        description: 'Block request and log security incident'
      },
      {
        type: 'escalate',
        description: 'Alert security team'
      }
    ]);
  }

  async handleErrorWithRecovery(
    error: SecureError,
    context: ErrorContext,
    operation: () => Promise<any>
  ): Promise<AutoRecoveryResult> {
    const recoveryKey = `${error.code}:${context.endpoint}:${context.userId}`;
    const recoveryActions = this.recoveryStrategies.get(error.code) || [];

    if (recoveryActions.length === 0) {
      return {
        success: false,
        action: 'none',
        message: `No recovery strategy found for error code: ${error.code}`
      };
    }

    // Get or create recovery context
    let recoveryContext = this.activeRecoveries.get(recoveryKey);
    if (!recoveryContext) {
      recoveryContext = {
        errorCode: error.code,
        serviceName: this.extractServiceName(context.endpoint),
        operation: context.endpoint || 'unknown',
        attemptCount: 0,
        lastAttemptTime: Date.now(),
        recoveryActions
      };
      this.activeRecoveries.set(recoveryKey, recoveryContext);
    }

    // Execute recovery actions in sequence
    for (const action of recoveryActions) {
      try {
        const result = await this.executeRecoveryAction(action, recoveryContext, operation);
        if (result.success) {
          this.activeRecoveries.delete(recoveryKey);
          return result;
        }
      } catch (recoveryError) {
        console.error(`Recovery action failed for ${error.code}:`, recoveryError);
      }
    }

    return {
      success: false,
      action: 'all_failed',
      message: `All recovery strategies failed for error: ${error.code}`
    };
  }

  private async executeRecoveryAction(
    action: RecoveryAction,
    context: RecoveryContext,
    operation: () => Promise<any>
  ): Promise<AutoRecoveryResult> {
    switch (action.type) {
      case 'retry':
        return await this.executeRetryRecovery(action, context, operation);
      
      case 'fallback':
        return await this.executeFallbackRecovery(action, context);
      
      case 'escalate':
        return await this.executeEscalationRecovery(action, context);
      
      case 'ignore':
        return {
          success: true,
          action: 'ignore',
          message: `Ignored error as per recovery strategy: ${action.description}`
        };
      
      default:
        return {
          success: false,
          action: 'unknown',
          message: `Unknown recovery action type: ${action.type}`
        };
    }
  }

  private async executeRetryRecovery(
    action: RecoveryAction,
    context: RecoveryContext,
    operation: () => Promise<any>
  ): Promise<AutoRecoveryResult> {
    const maxAttempts = action.maxAttempts || 3;
    
    if (context.attemptCount >= maxAttempts) {
      return {
        success: false,
        action: 'retry_exhausted',
        message: `Retry attempts exhausted (${maxAttempts})`
      };
    }

    try {
      // Execute custom recovery handler if provided
      if (action.handler) {
        await action.handler();
      }

      // Use retry service for the operation
      const result = await retryService.executeWithRetry(
        operation,
        this.getRetryConfigForService(context.serviceName),
        {
          maxAttempts: maxAttempts - context.attemptCount,
          baseDelay: action.delay || 1000
        }
      );

      if (result.success) {
        return {
          success: true,
          action: 'retry_success',
          message: `Operation succeeded after retry (attempt ${context.attemptCount + 1})`
        };
      } else {
        context.attemptCount++;
        return {
          success: false,
          action: 'retry_failed',
          message: `Retry failed: ${result.error?.message}`,
          error: result.error
        };
      }
    } catch (error) {
      context.attemptCount++;
      return {
        success: false,
        action: 'retry_error',
        message: `Retry operation threw error: ${(error as Error).message}`,
        error: error as Error
      };
    }
  }

  private async executeFallbackRecovery(
    action: RecoveryAction,
    context: RecoveryContext
  ): Promise<AutoRecoveryResult> {
    try {
      // Degrade service to use fallback mechanisms
      degradationService.degradeService(context.serviceName, 'degraded');
      
      // Try to get cached data for the operation
      const cachedData = degradationService.getCachedData(context.serviceName, context.operation);
      
      if (cachedData) {
        return {
          success: true,
          action: 'fallback_cache',
          message: `Using cached data for ${context.operation}`
        };
      }

      return {
        success: false,
        action: 'fallback_no_cache',
        message: `No cached data available for fallback`
      };
    } catch (error) {
      return {
        success: false,
        action: 'fallback_error',
        message: `Fallback recovery failed: ${(error as Error).message}`,
        error: error as Error
      };
    }
  }

  private async executeEscalationRecovery(
    action: RecoveryAction,
    context: RecoveryContext
  ): Promise<AutoRecoveryResult> {
    try {
      // Create escalation alert
      const escalationData = {
        errorCode: context.errorCode,
        serviceName: context.serviceName,
        operation: context.operation,
        attemptCount: context.attemptCount,
        timestamp: new Date().toISOString(),
        description: action.description
      };

      console.error('ESCALATION ALERT:', escalationData);
      
      // In production, this would:
      // - Send alerts to monitoring systems
      // - Create incidents in issue tracking
      // - Notify on-call personnel
      // - Update status pages
      
      // Degrade service to offline if this is a critical failure
      if (context.attemptCount > 5) {
        degradationService.degradeService(context.serviceName, 'offline');
      }

      return {
        success: true,
        action: 'escalated',
        message: `Error escalated: ${action.description}`
      };
    } catch (error) {
      return {
        success: false,
        action: 'escalation_error',
        message: `Escalation failed: ${(error as Error).message}`,
        error: error as Error
      };
    }
  }

  private extractServiceName(endpoint?: string): string {
    if (!endpoint) return 'unknown';
    
    if (endpoint.includes('gp51') || endpoint.includes('webapi')) return 'gp51';
    if (endpoint.includes('database') || endpoint.includes('supabase')) return 'database';
    if (endpoint.includes('auth')) return 'auth';
    
    return 'unknown';
  }

  private getRetryConfigForService(serviceName: string): string {
    switch (serviceName) {
      case 'gp51': return 'gp51-general';
      case 'database': return 'database';
      case 'auth': return 'gp51-auth';
      default: return 'default';
    }
  }

  // Session recovery for GP51
  async recoverGP51Session(): Promise<boolean> {
    try {
      console.log('Attempting GP51 session recovery...');
      
      // This would trigger the settings-management function to re-authenticate
      // For now, we'll simulate the recovery
      
      // Reset circuit breakers related to GP51
      circuitBreakerService.resetBreaker('gp51-auth');
      circuitBreakerService.resetBreaker('gp51-vehicles');
      circuitBreakerService.resetBreaker('gp51-positions');
      
      // Reset degradation for GP51 services
      degradationService.resetService('gp51');
      
      console.log('GP51 session recovery completed');
      return true;
    } catch (error) {
      console.error('GP51 session recovery failed:', error);
      return false;
    }
  }

  // Get recovery statistics
  getRecoveryStats(): {
    activeRecoveries: number;
    totalRecoveries: number;
    successfulRecoveries: number;
    failedRecoveries: number;
  } {
    return {
      activeRecoveries: this.activeRecoveries.size,
      totalRecoveries: 0, // This would be tracked over time
      successfulRecoveries: 0,
      failedRecoveries: 0
    };
  }

  // Manual recovery controls
  clearRecoveryContext(errorCode: string, endpoint?: string): void {
    const pattern = endpoint ? `${errorCode}:${endpoint}` : errorCode;
    
    for (const [key] of this.activeRecoveries) {
      if (key.includes(pattern)) {
        this.activeRecoveries.delete(key);
      }
    }
  }

  addRecoveryStrategy(errorCode: string, actions: RecoveryAction[]): void {
    this.recoveryStrategies.set(errorCode, actions);
    console.log(`Added recovery strategy for error code: ${errorCode}`);
  }
}

export const errorRecoveryService = ErrorRecoveryService.getInstance();
