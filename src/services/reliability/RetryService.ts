
import { circuitBreakerService } from './CircuitBreakerService';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterRange: number;
  retryableErrors: string[];
  circuitBreakerName?: string;
}

export interface RetryStats {
  attempt: number;
  totalAttempts: number;
  delay: number;
  error?: Error;
  startTime: number;
  endTime?: number;
}

export interface RetryResult<T> {
  result?: T;
  error?: Error;
  stats: RetryStats[];
  success: boolean;
  totalDuration: number;
}

export class RetryService {
  private static instance: RetryService;
  
  private configs: Record<string, RetryConfig> = {
    'gp51-auth': {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitterRange: 0.1,
      retryableErrors: ['network', 'timeout', 'rate limit', '429', '503', '502', '500'],
      circuitBreakerName: 'gp51-auth'
    },
    'gp51-vehicles': {
      maxAttempts: 4,
      baseDelay: 500,
      maxDelay: 8000,
      backoffMultiplier: 1.5,
      jitterRange: 0.2,
      retryableErrors: ['network', 'timeout', 'rate limit', '429', '503', '502'],
      circuitBreakerName: 'gp51-vehicles'
    },
    'gp51-positions': {
      maxAttempts: 5,
      baseDelay: 300,
      maxDelay: 5000,
      backoffMultiplier: 1.3,
      jitterRange: 0.15,
      retryableErrors: ['network', 'timeout', 'rate limit', '429', '503'],
      circuitBreakerName: 'gp51-positions'
    },
    'database': {
      maxAttempts: 3,
      baseDelay: 200,
      maxDelay: 2000,
      backoffMultiplier: 2,
      jitterRange: 0.1,
      retryableErrors: ['connection', 'timeout', 'deadlock', 'lock']
    },
    'default': {
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitterRange: 0.1,
      retryableErrors: ['network', 'timeout', '503', '502']
    }
  };

  static getInstance(): RetryService {
    if (!RetryService.instance) {
      RetryService.instance = new RetryService();
    }
    return RetryService.instance;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    configName: string = 'default',
    customConfig?: Partial<RetryConfig>
  ): Promise<RetryResult<T>> {
    const config = {
      ...this.configs[configName] || this.configs['default'],
      ...customConfig
    };

    const stats: RetryStats[] = [];
    const overallStartTime = Date.now();
    let lastError: Error;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      const attemptStartTime = Date.now();
      const attemptStats: RetryStats = {
        attempt,
        totalAttempts: config.maxAttempts,
        delay: 0,
        startTime: attemptStartTime
      };

      try {
        let result: T;
        
        // Use circuit breaker if configured
        if (config.circuitBreakerName) {
          result = await circuitBreakerService.executeWithBreaker(
            config.circuitBreakerName,
            operation
          );
        } else {
          result = await operation();
        }

        attemptStats.endTime = Date.now();
        stats.push(attemptStats);

        return {
          result,
          success: true,
          stats,
          totalDuration: Date.now() - overallStartTime
        };

      } catch (error) {
        lastError = error as Error;
        attemptStats.error = lastError;
        attemptStats.endTime = Date.now();

        // Check if error is retryable
        if (!this.isRetryableError(lastError, config.retryableErrors)) {
          console.log(`Non-retryable error on attempt ${attempt}:`, lastError.message);
          stats.push(attemptStats);
          break;
        }

        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          stats.push(attemptStats);
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        attemptStats.delay = delay;
        stats.push(attemptStats);

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
        await this.sleep(delay);
      }
    }

    return {
      error: lastError!,
      success: false,
      stats,
      totalDuration: Date.now() - overallStartTime
    };
  }

  private isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    
    return retryableErrors.some(pattern => 
      errorMessage.includes(pattern.toLowerCase()) || 
      errorName.includes(pattern.toLowerCase())
    );
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Base exponential backoff
    const exponentialDelay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Apply max delay cap
    const cappedDelay = Math.min(exponentialDelay, config.maxDelay);
    
    // Add jitter to avoid thundering herd
    const jitter = cappedDelay * config.jitterRange * (Math.random() * 2 - 1);
    
    return Math.max(0, Math.round(cappedDelay + jitter));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods for common operations
  async retryGP51Auth<T>(operation: () => Promise<T>): Promise<T> {
    const result = await this.executeWithRetry(operation, 'gp51-auth');
    if (!result.success) {
      throw result.error;
    }
    return result.result!;
  }

  async retryGP51Vehicles<T>(operation: () => Promise<T>): Promise<T> {
    const result = await this.executeWithRetry(operation, 'gp51-vehicles');
    if (!result.success) {
      throw result.error;
    }
    return result.result!;
  }

  async retryGP51Positions<T>(operation: () => Promise<T>): Promise<T> {
    const result = await this.executeWithRetry(operation, 'gp51-positions');
    if (!result.success) {
      throw result.error;
    }
    return result.result!;
  }

  async retryDatabase<T>(operation: () => Promise<T>): Promise<T> {
    const result = await this.executeWithRetry(operation, 'database');
    if (!result.success) {
      throw result.error;
    }
    return result.result!;
  }

  // Configuration management
  updateConfig(name: string, config: Partial<RetryConfig>): void {
    if (this.configs[name]) {
      this.configs[name] = { ...this.configs[name], ...config };
    } else {
      this.configs[name] = { ...this.configs['default'], ...config };
    }
    console.log(`Updated retry config for ${name}:`, config);
  }

  getConfig(name: string): RetryConfig {
    return { ...this.configs[name] || this.configs['default'] };
  }

  getAllConfigs(): Record<string, RetryConfig> {
    return { ...this.configs };
  }
}

export const retryService = RetryService.getInstance();
