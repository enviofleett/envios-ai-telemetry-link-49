
export interface RateLimitConfig {
  baseDelay: number; // Base delay between requests in ms
  maxDelay: number; // Maximum delay cap in ms
  backoffMultiplier: number; // Exponential backoff multiplier
  maxRetries: number; // Maximum retry attempts
  batchSize: number; // Batch size for processing
  circuitBreakerThreshold: number; // Failures before circuit opens
}

export interface RateLimitStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  averageDelay: number;
  lastRequestTime: number;
  circuitOpen: boolean;
}

export class GP51RateLimitingService {
  private static instance: GP51RateLimitingService;
  private config: RateLimitConfig;
  private stats: RateLimitStats;
  private lastRequestTime = 0;
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;

  private constructor() {
    this.config = {
      baseDelay: 3000, // 3 seconds between requests
      maxDelay: 30000, // 30 seconds max
      backoffMultiplier: 1.5,
      maxRetries: 3,
      batchSize: 10,
      circuitBreakerThreshold: 5
    };

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      averageDelay: 0,
      lastRequestTime: 0,
      circuitOpen: false
    };
  }

  static getInstance(): GP51RateLimitingService {
    if (!GP51RateLimitingService.instance) {
      GP51RateLimitingService.instance = new GP51RateLimitingService();
    }
    return GP51RateLimitingService.instance;
  }

  updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('📊 [RateLimit] Config updated:', this.config);
  }

  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  getStats(): RateLimitStats {
    return { ...this.stats, circuitOpen: this.isCircuitOpen() };
  }

  private isCircuitOpen(): boolean {
    return Date.now() < this.circuitOpenUntil;
  }

  private openCircuit(): void {
    this.circuitOpenUntil = Date.now() + 60000; // Open for 1 minute
    console.warn('🔴 [RateLimit] Circuit breaker opened - cooling down for 1 minute');
  }

  private closeCircuit(): void {
    this.consecutiveFailures = 0;
    this.circuitOpenUntil = 0;
    console.log('✅ [RateLimit] Circuit breaker closed - operations resumed');
  }

  async waitForRateLimit(): Promise<void> {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      const waitTime = this.circuitOpenUntil - Date.now();
      console.log(`⏳ [RateLimit] Circuit open, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Calculate delay since last request
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    const requiredDelay = this.config.baseDelay;

    if (timeSinceLastRequest < requiredDelay) {
      const waitTime = requiredDelay - timeSinceLastRequest;
      console.log(`⏳ [RateLimit] Waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.stats.totalRequests++;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    let currentDelay = this.config.baseDelay;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();
        
        console.log(`🔄 [RateLimit] ${operationName} - Attempt ${attempt}/${this.config.maxRetries}`);
        const result = await operation();
        
        // Success - reset failure count and close circuit
        this.stats.successfulRequests++;
        this.consecutiveFailures = 0;
        if (this.isCircuitOpen()) {
          this.closeCircuit();
        }
        
        return result;

      } catch (error) {
        lastError = error as Error;
        this.stats.failedRequests++;
        this.consecutiveFailures++;

        console.error(`❌ [RateLimit] ${operationName} failed (attempt ${attempt}):`, error);

        // Check for specific GP51 rate limiting or IP limit errors
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('ip limit') || errorMessage.includes('rate limit') || errorMessage.includes('8902')) {
          this.stats.rateLimitedRequests++;
          console.warn(`🚫 [RateLimit] Rate/IP limit detected for ${operationName}`);
          
          // Open circuit breaker if too many consecutive failures
          if (this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
            this.openCircuit();
          }
        }

        // Don't retry on last attempt
        if (attempt === this.config.maxRetries) {
          break;
        }

        // Exponential backoff
        const backoffDelay = Math.min(
          currentDelay * this.config.backoffMultiplier,
          this.config.maxDelay
        );
        
        console.log(`⏳ [RateLimit] Backing off for ${backoffDelay}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        currentDelay = backoffDelay;
      }
    }

    throw lastError!;
  }

  async processBatch<T>(
    items: T[],
    processor: (item: T) => Promise<any>,
    operationName: string
  ): Promise<{ results: any[], errors: Error[] }> {
    const results: any[] = [];
    const errors: Error[] = [];
    
    console.log(`📦 [RateLimit] Processing ${items.length} items in batches of ${this.config.batchSize}`);

    for (let i = 0; i < items.length; i += this.config.batchSize) {
      const batch = items.slice(i, i + this.config.batchSize);
      console.log(`📦 [RateLimit] Processing batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(items.length / this.config.batchSize)}`);

      for (const item of batch) {
        try {
          const result = await this.executeWithRetry(
            () => processor(item),
            `${operationName} batch item`
          );
          results.push(result);
        } catch (error) {
          console.error(`❌ [RateLimit] Batch item failed:`, error);
          errors.push(error as Error);
        }
      }
    }

    return { results, errors };
  }

  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitedRequests: 0,
      averageDelay: 0,
      lastRequestTime: 0,
      circuitOpen: false
    };
    this.consecutiveFailures = 0;
    this.circuitOpenUntil = 0;
    console.log('🔄 [RateLimit] Stats reset');
  }
}

export const rateLimitingService = GP51RateLimitingService.getInstance();
