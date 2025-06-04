interface AdaptiveRateLimitConfig {
  maxTokens: number;
  baseRefillRate: number; // tokens per second
  adaptiveMode: boolean;
  burstMultiplier: number;
  backoffFactor: number;
  performanceWindow: number; // milliseconds
}

interface RateLimitState {
  tokens: number;
  lastRefill: number;
  recentResponseTimes: number[];
  lastAdaptationTime: number;
  currentRefillRate: number;
}

export class EnhancedGP51RateLimiter {
  private config: AdaptiveRateLimitConfig;
  private state: RateLimitState;

  constructor(config: Partial<AdaptiveRateLimitConfig> = {}) {
    this.config = {
      maxTokens: config.maxTokens || 10,
      baseRefillRate: config.baseRefillRate || 1,
      adaptiveMode: config.adaptiveMode || true,
      burstMultiplier: config.burstMultiplier || 2,
      backoffFactor: config.backoffFactor || 0.5,
      performanceWindow: config.performanceWindow || 60000 // 1 minute
    };

    this.state = {
      tokens: this.config.maxTokens,
      lastRefill: Date.now(),
      recentResponseTimes: [],
      lastAdaptationTime: Date.now(),
      currentRefillRate: this.config.baseRefillRate
    };
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.state.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(timePassed * this.state.currentRefillRate);
    
    if (tokensToAdd > 0) {
      this.state.tokens = Math.min(this.config.maxTokens, this.state.tokens + tokensToAdd);
      this.state.lastRefill = now;
    }

    // Perform adaptive rate adjustment if enabled
    if (this.config.adaptiveMode && now - this.state.lastAdaptationTime > 10000) { // Every 10 seconds
      this.adaptRateLimit();
      this.state.lastAdaptationTime = now;
    }
  }

  private adaptRateLimit(): void {
    const now = Date.now();
    
    // Filter recent response times within the performance window
    this.state.recentResponseTimes = this.state.recentResponseTimes.filter(
      time => now - time < this.config.performanceWindow
    );

    if (this.state.recentResponseTimes.length < 3) {
      return; // Not enough data for adaptation
    }

    const recentAverage = this.state.recentResponseTimes.reduce((a, b) => a + b, 0) / this.state.recentResponseTimes.length;
    
    // Adapt based on API performance
    if (recentAverage > 5000) { // Slow responses (> 5 seconds)
      // Reduce rate to ease load on API
      this.state.currentRefillRate = Math.max(
        this.config.baseRefillRate * this.config.backoffFactor,
        0.1
      );
      console.log(`Adaptive rate limiting: Reduced rate to ${this.state.currentRefillRate} tokens/sec due to slow API responses`);
    } else if (recentAverage < 1000) { // Fast responses (< 1 second)
      // Increase rate for better throughput
      this.state.currentRefillRate = Math.min(
        this.config.baseRefillRate * this.config.burstMultiplier,
        this.config.baseRefillRate * 3
      );
      console.log(`Adaptive rate limiting: Increased rate to ${this.state.currentRefillRate} tokens/sec due to fast API responses`);
    } else {
      // Return to base rate for normal performance
      this.state.currentRefillRate = this.config.baseRefillRate;
    }
  }

  async acquire(tokens: number = 1): Promise<void> {
    const startTime = Date.now();
    this.refillTokens();
    
    if (this.state.tokens >= tokens) {
      this.state.tokens -= tokens;
      return;
    }
    
    // Calculate wait time needed
    const tokensNeeded = tokens - this.state.tokens;
    const waitTime = (tokensNeeded / this.state.currentRefillRate) * 1000; // milliseconds
    
    console.log(`Rate limit reached. Waiting ${waitTime}ms before next GP51 API call (current rate: ${this.state.currentRefillRate} tokens/sec)`);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Refill tokens after waiting
    this.refillTokens();
    this.state.tokens -= tokens;
    
    // Record the total time for this acquisition for adaptive adjustment
    const totalTime = Date.now() - startTime;
    this.recordResponseTime(totalTime);
  }

  recordResponseTime(responseTime: number): void {
    this.state.recentResponseTimes.push(responseTime);
    
    // Keep only recent response times (max 50 entries)
    if (this.state.recentResponseTimes.length > 50) {
      this.state.recentResponseTimes = this.state.recentResponseTimes.slice(-50);
    }
  }

  getAvailableTokens(): number {
    this.refillTokens();
    return this.state.tokens;
  }

  getStats() {
    const now = Date.now();
    const recentTimes = this.state.recentResponseTimes.filter(
      time => now - time < this.config.performanceWindow
    );
    
    return {
      availableTokens: this.state.tokens,
      maxTokens: this.config.maxTokens,
      currentRefillRate: this.state.currentRefillRate,
      baseRefillRate: this.config.baseRefillRate,
      recentResponseCount: recentTimes.length,
      averageResponseTime: recentTimes.length > 0 
        ? recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length 
        : 0,
      adaptiveMode: this.config.adaptiveMode
    };
  }

  // Factory method for creating optimized rate limiter based on job size
  static createForJobSize(totalUsers: number, estimatedVehiclesPerUser: number = 5): EnhancedGP51RateLimiter {
    const totalOperations = totalUsers * (1 + estimatedVehiclesPerUser / 10); // Rough estimate
    
    let config: Partial<AdaptiveRateLimitConfig>;
    
    if (totalOperations <= 50) {
      // Small job - more aggressive
      config = {
        maxTokens: 8,
        baseRefillRate: 1.5,
        adaptiveMode: false
      };
    } else if (totalOperations <= 200) {
      // Medium job - balanced
      config = {
        maxTokens: 6,
        baseRefillRate: 1.0,
        adaptiveMode: true
      };
    } else {
      // Large job - conservative
      config = {
        maxTokens: 4,
        baseRefillRate: 0.6,
        adaptiveMode: true,
        burstMultiplier: 1.5
      };
    }
    
    console.log(`Created optimized rate limiter for ${totalUsers} users (${totalOperations} est. operations):`, config);
    return new EnhancedGP51RateLimiter(config);
  }
}

// Create global instances for different job sizes
export const createRateLimiterForJob = (totalUsers: number, estimatedVehiclesPerUser?: number) => 
  EnhancedGP51RateLimiter.createForJobSize(totalUsers, estimatedVehiclesPerUser);
