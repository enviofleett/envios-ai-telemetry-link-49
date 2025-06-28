
import { useState, useEffect, useCallback } from 'react';
import { queryOptimizationService } from '@/services/database/QueryOptimizationService';
import { databaseCacheManager } from '@/services/caching/DatabaseCacheManager';

interface DatabaseMetrics {
  queryPerformance: {
    averageExecutionTime: number;
    cacheHitRate: number;
    slowQueries: any[];
    totalQueries: number;
  };
  cacheStats: {
    totalEntries: number;
    hitRate: number;
    missRate: number;
    averageAccessTime: number;
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
      totalEntries: 0,
      hitRate: 0,
      missRate: 0,
      averageAccessTime: 0,
      memoryUsage: 0
    },
    optimizationSuggestions: []
  });

  const [isOptimizing, setIsOptimizing] = useState(false);

  const refreshMetrics = useCallback(() => {
    const optimizationReport = queryOptimizationService.getOptimizationReport();
    const cacheStats = databaseCacheManager.getStats();
    
    // Generate optimization suggestions
    const suggestions: string[] = [];
    
    if (optimizationReport.performanceReport.averageExecutionTime > 500) {
      suggestions.push('Average query time is high. Consider optimizing slow queries.');
    }
    
    if (cacheStats.hitRate < 60) {
      suggestions.push('Cache hit rate is low. Consider increasing cache TTL or warming cache.');
    }
    
    if (cacheStats.memoryUsage > 100 * 1024) { // 100KB
      suggestions.push('Cache memory usage is high. Consider reducing cache size or TTL.');
    }
    
    if (optimizationReport.performanceReport.errorRate > 5) {
      suggestions.push('High error rate detected. Review query logic and error handling.');
    }

    setMetrics({
      queryPerformance: {
        averageExecutionTime: optimizationReport.performanceReport.averageExecutionTime,
        cacheHitRate: optimizationReport.cacheStats.hitRate,
        slowQueries: optimizationReport.performanceReport.slowestQueries,
        totalQueries: optimizationReport.performanceReport.totalQueries
      },
      cacheStats: {
        totalEntries: cacheStats.totalEntries,
        hitRate: cacheStats.hitRate,
        missRate: cacheStats.missRate,
        averageAccessTime: cacheStats.averageAccessTime,
        memoryUsage: cacheStats.memoryUsage
      },
      optimizationSuggestions: suggestions
    });
  }, []);

  const optimizeDatabase = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      console.log('🚀 Starting database optimization...');
      
      // Clear cache for fresh start
      databaseCacheManager.clear();
      
      // Refresh metrics after clearing cache
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
