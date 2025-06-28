interface QueryMetric {
  queryKey: string;
  executionTime: number;
  timestamp: Date;
  success: boolean;
  cacheHit: boolean;
  errorMessage?: string;
}

interface PerformanceReport {
  totalQueries: number;
  averageExecutionTime: number;
  slowestQueries: QueryMetric[];
  fastestQueries: QueryMetric[];
  errorRate: number;
  cacheHitRate: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export class QueryPerformanceMonitor {
  private static instance: QueryPerformanceMonitor;
  private metrics: QueryMetric[] = [];
  private maxMetrics = 1000;

  static getInstance(): QueryPerformanceMonitor {
    if (!QueryPerformanceMonitor.instance) {
      QueryPerformanceMonitor.instance = new QueryPerformanceMonitor();
    }
    return QueryPerformanceMonitor.instance;
  }

  recordQuery(
    queryKey: string,
    executionTime: number,
    success: boolean,
    cacheHit: boolean,
    errorMessage?: string
  ): void {
    const metric: QueryMetric = {
      queryKey,
      executionTime,
      timestamp: new Date(),
      success,
      cacheHit,
      errorMessage
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow queries
    if (executionTime > 1000) {
      console.warn(`🐌 Slow query detected: ${queryKey} took ${executionTime}ms`);
    }

    // Log errors
    if (!success && errorMessage) {
      console.error(`❌ Query failed: ${queryKey} - ${errorMessage}`);
    }
  }

  getPerformanceReport(timeRangeMinutes: number = 60): PerformanceReport {
    const cutoffTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    if (recentMetrics.length === 0) {
      return {
        totalQueries: 0,
        averageExecutionTime: 0,
        slowestQueries: [],
        fastestQueries: [],
        errorRate: 0,
        cacheHitRate: 0,
        timeRange: {
          start: cutoffTime,
          end: new Date()
        }
      };
    }

    const totalQueries = recentMetrics.length;
    const successfulQueries = recentMetrics.filter(m => m.success);
    const cacheHits = recentMetrics.filter(m => m.cacheHit);
    
    const averageExecutionTime = successfulQueries.length > 0
      ? successfulQueries.reduce((sum, m) => sum + m.executionTime, 0) / successfulQueries.length
      : 0;

    const sortedBySpeed = [...successfulQueries].sort((a, b) => a.executionTime - b.executionTime);

    return {
      totalQueries,
      averageExecutionTime,
      slowestQueries: sortedBySpeed.slice(-5).reverse(),
      fastestQueries: sortedBySpeed.slice(0, 5),
      errorRate: ((totalQueries - successfulQueries.length) / totalQueries) * 100,
      cacheHitRate: (cacheHits.length / totalQueries) * 100,
      timeRange: {
        start: cutoffTime,
        end: new Date()
      }
    };
  }

  getQueryStatistics(queryKey: string): {
    totalExecutions: number;
    averageTime: number;
    successRate: number;
    cacheHitRate: number;
  } {
    const queryMetrics = this.metrics.filter(m => m.queryKey === queryKey);
    
    if (queryMetrics.length === 0) {
      return {
        totalExecutions: 0,
        averageTime: 0,
        successRate: 0,
        cacheHitRate: 0
      };
    }

    const successfulQueries = queryMetrics.filter(m => m.success);
    const cacheHits = queryMetrics.filter(m => m.cacheHit);
    
    return {
      totalExecutions: queryMetrics.length,
      averageTime: successfulQueries.length > 0 
        ? successfulQueries.reduce((sum, m) => sum + m.executionTime, 0) / successfulQueries.length 
        : 0,
      successRate: (successfulQueries.length / queryMetrics.length) * 100,
      cacheHitRate: (cacheHits.length / queryMetrics.length) * 100
    };
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  exportMetrics(): QueryMetric[] {
    return [...this.metrics];
  }
}

export const queryPerformanceMonitor = QueryPerformanceMonitor.getInstance();
