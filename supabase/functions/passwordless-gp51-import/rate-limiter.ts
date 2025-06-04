
interface RateLimitState {
  tokens: number;
  lastRefill: number;
}

export class GP51RateLimiter {
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private state: RateLimitState;

  constructor(maxTokens: number = 10, refillRate: number = 1) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.state = {
      tokens: maxTokens,
      lastRefill: Date.now()
    };
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.state.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(timePassed * this.refillRate);
    
    if (tokensToAdd > 0) {
      this.state.tokens = Math.min(this.maxTokens, this.state.tokens + tokensToAdd);
      this.state.lastRefill = now;
    }
  }

  async acquire(tokens: number = 1): Promise<void> {
    this.refillTokens();
    
    if (this.state.tokens >= tokens) {
      this.state.tokens -= tokens;
      return;
    }
    
    // Calculate wait time needed
    const tokensNeeded = tokens - this.state.tokens;
    const waitTime = (tokensNeeded / this.refillRate) * 1000; // milliseconds
    
    console.log(`Rate limit reached. Waiting ${waitTime}ms before next GP51 API call`);
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Refill tokens after waiting
    this.refillTokens();
    this.state.tokens -= tokens;
  }

  getAvailableTokens(): number {
    this.refillTokens();
    return this.state.tokens;
  }
}

// Global rate limiter instance for GP51 API calls
export const gp51RateLimiter = new GP51RateLimiter(5, 0.5); // 5 requests max, refill 1 every 2 seconds
