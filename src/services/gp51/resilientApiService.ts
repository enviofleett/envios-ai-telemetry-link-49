
import { secureTokenManager } from './secureTokenManager';
import { ErrorClassificationService, GP51Error } from './errorClassificationService';

interface ApiCallOptions {
  maxRetries?: number;
  timeout?: number;
  enableCache?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: GP51Error;
  fromCache?: boolean;
  responseTime?: number;
}

export class ResilientApiService {
  private static instance: ResilientApiService;
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private circuitBreaker: Map<string, { failures: number; lastFailure: number; isOpen: boolean }> = new Map();

  static getInstance(): ResilientApiService {
    if (!ResilientApiService.instance) {
      ResilientApiService.instance = new ResilientApiService();
    }
    return ResilientApiService.instance;
  }

  async callGP51API<T = any>(
    action: string,
    params: Record<string, any> = {},
    options: ApiCallOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      maxRetries = 3,
      timeout = 30000,
      enableCache = false,
      cacheKey,
      cacheTTL = 60000
    } = options;

    const startTime = Date.now();
    const key = cacheKey || `${action}_${JSON.stringify(params)}`;

    // Check cache first
    if (enableCache && this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      if (cached.expires > Date.now()) {
        console.log('📋 Cache hit for GP51 API call:', action);
        return {
          success: true,
          data: cached.data,
          fromCache: true,
          responseTime: Date.now() - startTime
        };
      } else {
        this.cache.delete(key);
      }
    }

    // Check circuit breaker
    if (this.isCircuitOpen(action)) {
      const error = ErrorClassificationService.classifyError({
        message: 'Circuit breaker is open for this endpoint'
      });
      return { success: false, error };
    }

    let lastError: GP51Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.performApiCall<T>(action, params, timeout);
        
        if (result.success) {
          // Reset circuit breaker on success
          this.resetCircuitBreaker(action);
          
          // Cache successful response
          if (enableCache && result.data) {
            this.cache.set(key, {
              data: result.data,
              expires: Date.now() + cacheTTL
            });
          }

          return {
            ...result,
            responseTime: Date.now() - startTime
          };
        } else {
          lastError = result.error!;
          const strategy = ErrorClassificationService.getRecoveryStrategy(lastError);
          
          if (!strategy.shouldRetry || attempt >= maxRetries) {
            this.recordFailure(action);
            break;
          }

          // Wait before retry
          if (strategy.retryDelay > 0) {
            console.log(`⏳ Retrying GP51 API call in ${strategy.retryDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, strategy.retryDelay));
          }
        }
      } catch (error) {
        lastError = ErrorClassificationService.classifyError(error, action);
        this.recordFailure(action);
      }
    }

    return {
      success: false,
      error: lastError || ErrorClassificationService.classifyError({ message: 'Unknown error' }),
      responseTime: Date.now() - startTime
    };
  }

  private async performApiCall<T>(action: string, params: Record<string, any>, timeout: number): Promise<ApiResponse<T>> {
    const tokenData = await secureTokenManager.getSecureToken();
    
    if (!tokenData) {
      return {
        success: false,
        error: ErrorClassificationService.classifyError({
          message: 'No valid GP51 token available'
        })
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const apiUrl = 'https://www.gps51.com/webapi';
      const url = `${apiUrl}?action=${action}&token=${encodeURIComponent(tokenData.token)}&username=${encodeURIComponent(tokenData.username)}`;

      console.log('📡 GP51 API Call:', { action, hasParams: Object.keys(params).length > 0 });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'EnvioFleet/1.0'
        },
        body: JSON.stringify(params),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from GP51 API');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
      }

      if (parsedResponse.status !== 0) {
        throw new Error(`GP51 API Error ${parsedResponse.status}: ${parsedResponse.cause}`);
      }

      return {
        success: true,
        data: parsedResponse as T
      };

    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        error: ErrorClassificationService.classifyError(error, action)
      };
    }
  }

  private isCircuitOpen(endpoint: string): boolean {
    const breaker = this.circuitBreaker.get(endpoint);
    if (!breaker) return false;

    // Reset circuit breaker after 60 seconds
    if (breaker.isOpen && Date.now() - breaker.lastFailure > 60000) {
      breaker.isOpen = false;
      breaker.failures = 0;
    }

    return breaker.isOpen;
  }

  private recordFailure(endpoint: string): void {
    const breaker = this.circuitBreaker.get(endpoint) || { failures: 0, lastFailure: 0, isOpen: false };
    breaker.failures++;
    breaker.lastFailure = Date.now();

    // Open circuit breaker after 3 failures
    if (breaker.failures >= 3) {
      breaker.isOpen = true;
      console.warn(`🔴 Circuit breaker opened for GP51 endpoint: ${endpoint}`);
    }

    this.circuitBreaker.set(endpoint, breaker);
  }

  private resetCircuitBreaker(endpoint: string): void {
    this.circuitBreaker.delete(endpoint);
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { entries: number; totalSize: number } {
    return {
      entries: this.cache.size,
      totalSize: Array.from(this.cache.values()).reduce((size, entry) => 
        size + JSON.stringify(entry.data).length, 0
      )
    };
  }
}

export const resilientApiService = ResilientApiService.getInstance();
