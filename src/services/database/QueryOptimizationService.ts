
import { supabase } from '@/integrations/supabase/client';
import { databaseCacheManager } from '@/services/caching/DatabaseCacheManager';
import { queryPerformanceMonitor } from '@/services/monitoring/QueryPerformanceMonitor';

interface OptimizationStrategy {
  useCache: boolean;
  cacheTTL: number;
  enablePrefetch: boolean;
  batchSize?: number;
  retryAttempts: number;
}

interface QueryContext {
  userId?: string;
  priority: 'low' | 'medium' | 'high';
  timeout?: number;
}

export class QueryOptimizationService {
  private static instance: QueryOptimizationService;
  
  private optimizationStrategies: Map<string, OptimizationStrategy> = new Map([
    ['vehicles', { useCache: true, cacheTTL: 5 * 60 * 1000, enablePrefetch: true, retryAttempts: 2 }],
    ['positions', { useCache: true, cacheTTL: 30 * 1000, enablePrefetch: false, retryAttempts: 1 }],
    ['fleet:statistics', { useCache: true, cacheTTL: 60 * 1000, enablePrefetch: true, retryAttempts: 2 }],
    ['user:profile', { useCache: true, cacheTTL: 10 * 60 * 1000, enablePrefetch: false, retryAttempts: 3 }]
  ]);

  static getInstance(): QueryOptimizationService {
    if (!QueryOptimizationService.instance) {
      QueryOptimizationService.instance = new QueryOptimizationService();
    }
    return QueryOptimizationService.instance;
  }

  async executeOptimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    context: QueryContext = { priority: 'medium' }
  ): Promise<T> {
    const strategy = this.getOptimizationStrategy(queryKey);
    const startTime = Date.now();
    let cacheHit = false;
    let result: T;
    let error: any = null;

    try {
      // Try cache first if enabled
      if (strategy.useCache) {
        const cached = await databaseCacheManager.get<T>(queryKey);
        if (cached !== null) {
          cacheHit = true;
          result = cached;
          this.recordMetrics(queryKey, Date.now() - startTime, true, cacheHit);
          return result;
        }
      }

      // Execute query with retry logic
      result = await this.executeWithRetry(queryFn, strategy.retryAttempts);

      // Cache successful results
      if (strategy.useCache && result) {
        await databaseCacheManager.set(queryKey, result, strategy.cacheTTL);
      }

      // Prefetch related data if enabled
      if (strategy.enablePrefetch) {
        this.scheduleRelatedDataPrefetch(queryKey, context);
      }

      this.recordMetrics(queryKey, Date.now() - startTime, true, cacheHit);
      return result;

    } catch (err) {
      error = err;
      this.recordMetrics(queryKey, Date.now() - startTime, false, cacheHit, error.message);
      throw error;
    }
  }

  private async executeWithRetry<T>(
    queryFn: () => Promise<T>,
    maxAttempts: number
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          console.warn(`Query attempt ${attempt} failed, retrying in ${delay}ms...`);
        }
      }
    }

    throw lastError;
  }

  private getOptimizationStrategy(queryKey: string): OptimizationStrategy {
    // Find matching strategy by key pattern
    for (const [pattern, strategy] of this.optimizationStrategies.entries()) {
      if (queryKey.includes(pattern)) {
        return strategy;
      }
    }

    // Default strategy
    return {
      useCache: true,
      cacheTTL: 5 * 60 * 1000,
      enablePrefetch: false,
      retryAttempts: 1
    };
  }

  private scheduleRelatedDataPrefetch(queryKey: string, context: QueryContext): void {
    // Schedule prefetch for related data based on query patterns
    setTimeout(async () => {
      try {
        if (queryKey.includes('vehicles') && context.userId) {
          // Prefetch recent positions for vehicles
          const vehiclePositionsKey = `positions:user:${context.userId}`;
          const cachedPositions = await databaseCacheManager.get(vehiclePositionsKey);
          
          if (!cachedPositions) {
            console.log(`🔄 Prefetching positions for user ${context.userId}`);
            // Execute prefetch query here if needed
          }
        }
      } catch (error) {
        console.warn('Prefetch operation failed:', error);
      }
    }, 100); // Small delay to not block main operation
  }

  private recordMetrics(
    queryKey: string,
    executionTime: number,
    success: boolean,
    cacheHit: boolean,
    errorMessage?: string
  ): void {
    queryPerformanceMonitor.recordQuery(
      queryKey,
      executionTime,
      success,
      cacheHit,
      errorMessage
    );
  }

  // Batch operations for improved performance
  async executeBatchQueries<T>(
    queries: Array<{ key: string; fn: () => Promise<T>; context?: QueryContext }>
  ): Promise<T[]> {
    const batchSize = 5; // Limit concurrent queries
    const results: T[] = [];

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchPromises = batch.map(query => 
        this.executeOptimizedQuery(query.key, query.fn, query.context)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error('Batch query failed:', result.reason);
          throw result.reason;
        }
      }
    }

    return results;
  }

  // Smart cache invalidation
  invalidateRelatedCache(pattern: string): number {
    console.log(`🗑️ Invalidating cache pattern: ${pattern}`);
    return databaseCacheManager.invalidate(pattern);
  }

  // Performance analytics
  getOptimizationReport(): {
    cacheStats: any;
    performanceReport: any;
    recommendations: string[];
  } {
    const cacheStats = databaseCacheManager.getStats();
    const performanceReport = queryPerformanceMonitor.getPerformanceReport();
    
    const recommendations: string[] = [];
    
    if (cacheStats.hitRate < 50) {
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
    }
    
    if (performanceReport.averageExecutionTime > 500) {
      recommendations.push('Consider optimizing slow queries or adding database indexes');
    }
    
    if (performanceReport.errorRate > 5) {
      recommendations.push('High error rate detected - review query logic and error handling');
    }

    return {
      cacheStats,
      performanceReport,
      recommendations
    };
  }
}

export const queryOptimizationService = QueryOptimizationService.getInstance();
