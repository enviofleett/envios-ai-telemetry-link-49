
import { QueryClient } from '@tanstack/react-query';

export const optimizedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408, 429
        if (error instanceof Error) {
          const status = (error as any)?.status;
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        const status = (error as any)?.status;
        if (status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: 1000,
    },
  },
});

// Create optimizedQueryService with metrics and management functions
export const optimizedQueryService = {
  getMetrics: () => {
    const queryCache = optimizedQueryClient.getQueryCache();
    const mutationCache = optimizedQueryClient.getMutationCache();
    
    const queries = queryCache.getAll();
    const mutations = mutationCache.getAll();
    
    const totalQueries = queries.length;
    const failedQueries = queries.filter(q => q.state.status === 'error').length;
    const cacheHits = queries.filter(q => q.state.dataUpdatedAt > 0).length;
    const cacheMisses = totalQueries - cacheHits;
    
    // Calculate average query time (simplified - using dataUpdatedAt as proxy)
    const queryTimes = queries
      .map(q => q.state.dataUpdatedAt)
      .filter(t => t > 0);
    const averageQueryTime = queryTimes.length > 0 ? 
      queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length : 0;
    
    return {
      totalQueries,
      failedQueries,
      cacheHits,
      cacheMisses,
      cacheSize: totalQueries,
      averageQueryTime: averageQueryTime || 0,
    };
  },

  getDetailedCacheInfo: () => {
    const queryCache = optimizedQueryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    const totalQueries = queries.length;
    const activeQueries = queries.filter(q => q.getObserversCount() > 0).length;
    const staleQueries = queries.filter(q => q.isStale()).length;
    
    // Rough estimate of cache size
    const cacheSizeEstimate = `~${Math.round(totalQueries * 0.5)}KB`;
    
    return {
      totalQueries,
      activeQueries,
      staleQueries,
      cacheSizeEstimate,
    };
  },

  clearCache: () => {
    optimizedQueryClient.clear();
  },

  invalidateStaleQueries: () => {
    optimizedQueryClient.invalidateQueries({
      predicate: (query) => query.isStale(),
    });
  },
};
