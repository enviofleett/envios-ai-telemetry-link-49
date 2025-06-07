
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export interface CircuitBreakerStats {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
  totalCalls: number;
  failureRate: number;
}

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private halfOpenCalls = 0;
  private totalCalls = 0;
  private recentCalls: boolean[] = [];

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < (this.nextAttemptTime || 0)) {
        throw new Error(`Circuit breaker ${this.name} is OPEN. Next attempt at ${new Date(this.nextAttemptTime!).toISOString()}`);
      }
      
      // Transition to HALF_OPEN
      this.state = 'HALF_OPEN';
      this.halfOpenCalls = 0;
      console.log(`Circuit breaker ${this.name} transitioning to HALF_OPEN`);
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      throw new Error(`Circuit breaker ${this.name} is HALF_OPEN and has reached max calls limit`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.successes++;
    this.totalCalls++;
    this.recentCalls.push(true);
    this.trimRecentCalls();

    if (this.state === 'HALF_OPEN') {
      this.halfOpenCalls++;
      
      // If we've had enough successful calls in HALF_OPEN, close the circuit
      if (this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.state = 'CLOSED';
        this.failures = 0;
        this.lastFailureTime = undefined;
        this.nextAttemptTime = undefined;
        console.log(`Circuit breaker ${this.name} transitioned to CLOSED after successful recovery`);
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.totalCalls++;
    this.lastFailureTime = Date.now();
    this.recentCalls.push(false);
    this.trimRecentCalls();

    if (this.state === 'HALF_OPEN') {
      // Failed during half-open, go back to open
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
      console.log(`Circuit breaker ${this.name} failed during HALF_OPEN, returning to OPEN`);
    } else if (this.state === 'CLOSED') {
      const failureRate = this.getFailureRate();
      
      if (failureRate >= this.config.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
        console.log(`Circuit breaker ${this.name} opened due to failure rate: ${failureRate}%`);
      }
    }
  }

  private trimRecentCalls(): void {
    const maxCalls = Math.max(50, this.config.monitoringPeriod);
    if (this.recentCalls.length > maxCalls) {
      this.recentCalls = this.recentCalls.slice(-maxCalls);
    }
  }

  private getFailureRate(): number {
    if (this.recentCalls.length === 0) return 0;
    
    const failures = this.recentCalls.filter(success => !success).length;
    return (failures / this.recentCalls.length) * 100;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
      totalCalls: this.totalCalls,
      failureRate: this.getFailureRate()
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    this.halfOpenCalls = 0;
    this.recentCalls = [];
    console.log(`Circuit breaker ${this.name} manually reset`);
  }

  isAvailable(): boolean {
    if (this.state === 'CLOSED') return true;
    if (this.state === 'HALF_OPEN' && this.halfOpenCalls < this.config.halfOpenMaxCalls) return true;
    if (this.state === 'OPEN' && Date.now() >= (this.nextAttemptTime || 0)) return true;
    return false;
  }
}

export class CircuitBreakerService {
  private static instance: CircuitBreakerService;
  private breakers = new Map<string, CircuitBreaker>();
  
  private configs: Record<string, CircuitBreakerConfig> = {
    'gp51-auth': {
      failureThreshold: 50, // 50% failure rate
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 20, // Monitor last 20 calls
      halfOpenMaxCalls: 3
    },
    'gp51-vehicles': {
      failureThreshold: 60, // 60% failure rate  
      recoveryTimeout: 15000, // 15 seconds
      monitoringPeriod: 10,
      halfOpenMaxCalls: 2
    },
    'gp51-positions': {
      failureThreshold: 70, // 70% failure rate
      recoveryTimeout: 10000, // 10 seconds
      monitoringPeriod: 15,
      halfOpenMaxCalls: 3
    },
    'gp51-general': {
      failureThreshold: 50,
      recoveryTimeout: 20000,
      monitoringPeriod: 15,
      halfOpenMaxCalls: 2
    }
  };

  static getInstance(): CircuitBreakerService {
    if (!CircuitBreakerService.instance) {
      CircuitBreakerService.instance = new CircuitBreakerService();
    }
    return CircuitBreakerService.instance;
  }

  getCircuitBreaker(name: string, customConfig?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const config = {
        ...this.configs[name] || this.configs['gp51-general'],
        ...customConfig
      };
      
      this.breakers.set(name, new CircuitBreaker(name, config));
      console.log(`Created circuit breaker: ${name}`, config);
    }
    
    return this.breakers.get(name)!;
  }

  async executeWithBreaker<T>(
    breakerName: string,
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    const breaker = this.getCircuitBreaker(breakerName);
    
    try {
      return await breaker.execute(operation);
    } catch (error) {
      console.error(`Circuit breaker ${breakerName} operation failed:`, error);
      
      if (fallback && !breaker.isAvailable()) {
        console.log(`Circuit breaker ${breakerName} is not available, executing fallback`);
        return await fallback();
      }
      
      throw error;
    }
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    
    return stats;
  }

  resetBreaker(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  resetAllBreakers(): void {
    this.breakers.forEach(breaker => breaker.reset());
    console.log('All circuit breakers reset');
  }

  updateBreakerConfig(name: string, config: Partial<CircuitBreakerConfig>): void {
    if (this.configs[name]) {
      this.configs[name] = { ...this.configs[name], ...config };
      console.log(`Updated circuit breaker config for ${name}:`, config);
    }
  }
}

export const circuitBreakerService = CircuitBreakerService.getInstance();
