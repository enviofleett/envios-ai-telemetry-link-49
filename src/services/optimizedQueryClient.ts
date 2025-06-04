import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

interface QueryMetrics {
  cacheHits: number;
  cacheMisses: number;
  failedQueries: number;
  totalQueries: number;
  averageQueryTime: number;
  cacheSize: number;
}

class OptimizedQueryService {
  private queryClient: QueryClient;
  private metrics: QueryMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    failedQueries: 0,
    totalQueries: 0,
    averageQueryTime: 0,
    cacheSize: 0
  };
  private queryTimes: number[] = [];

  constructor() {
    this.queryClient = new QueryClient({
      queryCache: new QueryCache({
        onSuccess: (data, query) => {
          this.metrics.cacheHits++;
          this.trackQueryTime(query);
          this.updateCacheSize();
          console.debug('Query cache hit:', query.queryKey);
        },
        onError: (error, query) => {
          this.metrics.failedQueries++;
          console.error('Query failed:', query.queryKey, error);
        }
      }),
      mutationCache: new MutationCache({
        onSuccess: (data, variables, context, mutation) => {
          console.debug('Mutation succeeded:', mutation.options.mutationKey);
        },
        onError: (error, variables, context, mutation) => {
          console.error('Mutation failed:', mutation.options.mutationKey, error);
        }
      }),
      defaultOptions: {
        queries: {
          // Aggressive caching for stable data
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
          
          // Retry configuration
          retry: (failureCount, error: any) => {
            // Don't retry on authentication errors
            if (error?.status === 401 || error?.status === 403) {
              return false;
            }
            // Retry up to 3 times for other errors
            return failureCount < 3;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          
          // Background refetching
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          refetchOnMount: true,
          
          // Performance optimizations
          refetchInterval: false, // Disable automatic polling by default
          networkMode: 'online',
          
          // Error handling
          throwOnError: false,
          
          // Deduplication
          structuralSharing: true
        },
        mutations: {
          retry: 1,
          networkMode: 'online',
          throwOnError: true
        }
      }
    });

    // Set up periodic cache cleanup
    this.setupCacheCleanup();
  }

  private trackQueryTime(query: any): void {
    if (query.state.dataUpdatedAt && query.state.fetchFailureCount === 0) {
      const queryTime = Date.now() - (query.state.fetchFailureCount || Date.now());
      this.queryTimes.push(queryTime);
      
      // Keep only recent 100 query times
      if (this.queryTimes.length > 100) {
        this.queryTimes = this.queryTimes.slice(-100);
      }
      
      this.metrics.averageQueryTime = this.queryTimes.reduce((sum, time) => sum + time, 0) / this.queryTimes.length;
    }
    
    this.metrics.totalQueries++;
  }

  private updateCacheSize(): void {
    const cache = this.queryClient.getQueryCache();
    this.metrics.cacheSize = cache.getAll().length;
  }

  private setupCacheCleanup(): void {
    // Clean up stale queries every 5 minutes
    setInterval(() => {
      const cache = this.queryClient.getQueryCache();
      const queries = cache.getAll();
      
      let removedCount = 0;
      queries.forEach(query => {
        // Remove queries that haven't been used in 15 minutes
        const lastUsed = query.state.dataUpdatedAt || 0;
        const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
        
        if (lastUsed < fifteenMinutesAgo && !query.getObserversCount()) {
          cache.remove(query);
          removedCount++;
        }
      });
      
      if (removedCount > 0) {
        console.debug(`Cleaned up ${removedCount} stale queries from cache`);
        this.updateCacheSize();
      }
    }, 5 * 60 * 1000);
  }

  public getQueryClient(): QueryClient {
    return this.queryClient;
  }

  public getMetrics(): QueryMetrics {
    this.updateCacheSize();
    return { ...this.metrics };
  }

  public invalidateStaleQueries(): void {
    this.queryClient.invalidateQueries({
      predicate: (query) => {
        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        return (query.state.dataUpdatedAt || 0) < tenMinutesAgo;
      }
    });
    console.debug('Invalidated stale queries');
  }

  public prefetchQuery(queryKey: string[], queryFn: () => Promise<any>): void {
    this.queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 5 * 60 * 1000
    });
  }

  public clearCache(): void {
    this.queryClient.clear();
    this.metrics.cacheSize = 0;
    console.debug('Query cache cleared');
  }

  public getDetailedCacheInfo() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cacheSizeEstimate: this.estimateCacheSize(queries),
      queryBreakdown: queries.map(q => ({
        key: q.queryKey,
        state: q.state.status,
        observers: q.getObserversCount(),
        dataSize: this.estimateDataSize(q.state.data),
        lastUpdated: q.state.dataUpdatedAt ? new Date(q.state.dataUpdatedAt).toISOString() : null
      }))
    };
  }

  private estimateCacheSize(queries: any[]): string {
    let totalSize = 0;
    queries.forEach(query => {
      totalSize += this.estimateDataSize(query.state.data);
    });
    return `${(totalSize / 1024).toFixed(2)} KB`;
  }

  private estimateDataSize(data: any): number {
    if (!data) return 0;
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }
}

export const optimizedQueryService = new OptimizedQueryService();
export const optimizedQueryClient = optimizedQueryService.getQueryClient();
