
import { useState, useEffect, useCallback } from 'react';
import { optimizedQueryService } from '@/services/database/OptimizedQueryService';
import { databaseCacheManager } from '@/services/caching/DatabaseCacheManager';

interface DatabaseMetrics {
  queryPerformance: {
    averageExecutionTime: number;
    cacheHitRate: number;
    slowQueries: any[];
    totalQueries: number;
  };
  cacheStats: {
    hitRate: number;
    missRate: number;
    totalRequests: number;
    cacheSize: number;
    memoryUsage: number;
  };
  optimizationSuggestions: string[];
}

export function useDatabaseOptimization() {
  const [metrics, setMetrics] = useState<DatabaseMetrics>({
    queryPerformance: {
      averageExecutionTime: 0,
      cacheHitRate: 0,
      slowQueries: [],
      totalQueries: 0
    },
    cacheStats: {
      hitRate: 0,
      missRate: 0,
      totalRequests: 0,
      cacheSize: 0,
      memoryUsage: 0
    },
    optimizationSuggestions: []
  });

  const [isOptimizing, setIsOptimizing] = useState(false);

  const refreshMetrics = useCallback(() => {
    const queryPerformance = optimizedQueryService.getPerformanceMetrics();
    const cacheStats = databaseCacheManager.getStats();
    
    // Generate optimization suggestions
    const suggestions: string[] = [];
    
    if (queryPerformance.averageExecutionTime > 500) {
      suggestions.push('Average query time is high. Consider optimizing slow queries.');
    }
    
    if (queryPerformance.cacheHitRate < 60) {
      suggestions.push('Cache hit rate is low. Consider increasing cache TTL or warming cache.');
    }
    
    if (cacheStats.memoryUsage > 100 * 1024) { // 100MB
      suggestions.push('Cache memory usage is high. Consider reducing cache size or TTL.');
    }
    
    if (queryPerformance.slowQueries.length > 5) {
      suggestions.push('Multiple slow queries detected. Review and optimize database indexes.');
    }

    setMetrics({
      queryPerformance,
      cacheStats,
      optimizationSuggestions: suggestions
    });
  }, []);

  const optimizeDatabase = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      console.log('🚀 Starting database optimization...');
      
      // Clear cache and warmup
      databaseCacheManager.clear();
      await optimizedQueryService.warmupCache();
      
      // Refresh metrics
      setTimeout(refreshMetrics, 1000);
      
      console.log('✅ Database optimization completed');
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  }, [refreshMetrics]);

  const clearCache = useCallback(() => {
    databaseCacheManager.clear();
    refreshMetrics();
  }, [refreshMetrics]);

  // Auto-refresh metrics every 30 seconds
  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return {
    metrics,
    isOptimizing,
    optimizeDatabase,
    clearCache,
    refreshMetrics
  };
}
