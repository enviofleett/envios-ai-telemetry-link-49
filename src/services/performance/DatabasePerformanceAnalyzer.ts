import { supabase } from '@/integrations/supabase/client';

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  database: string;
  status: 'success' | 'error';
  rowsAffected?: number;
  error?: string;
}

export interface ConnectionPoolStats {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
  utilizationPercentage: number;
  averageWaitTime: number;
  connectionErrors: number;
}

export interface SlowQueryAlert {
  query: string;
  duration: number;
  threshold: number;
  timestamp: Date;
  severity: 'warning' | 'critical';
}

export class DatabasePerformanceAnalyzer {
  private static instance: DatabasePerformanceAnalyzer;
  private queryMetrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private criticalQueryThreshold = 5000; // 5 seconds
  private maxMetricsHistory = 1000;
  private connectionStats: ConnectionPoolStats = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    maxConnections: 100,
    utilizationPercentage: 0,
    averageWaitTime: 0,
    connectionErrors: 0
  };

  static getInstance(): DatabasePerformanceAnalyzer {
    if (!DatabasePerformanceAnalyzer.instance) {
      DatabasePerformanceAnalyzer.instance = new DatabasePerformanceAnalyzer();
    }
    return DatabasePerformanceAnalyzer.instance;
  }

  public startMonitoring(): void {
    console.log('Starting database performance monitoring...');
    
    // Monitor connection pool every 30 seconds
    setInterval(() => {
      this.checkConnectionPool();
    }, 30000);

    // Analyze slow queries every minute
    setInterval(() => {
      this.analyzeSlowQueries();
    }, 60000);

    // Cleanup old metrics every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
  }

  public trackQuery(query: string, startTime: number): (success: boolean, rowsAffected?: number, error?: string) => void {
    return (success: boolean, rowsAffected?: number, error?: string) => {
      const duration = Date.now() - startTime;
      
      const metric: QueryMetrics = {
        query: this.sanitizeQuery(query),
        duration,
        timestamp: new Date(),
        database: 'supabase',
        status: success ? 'success' : 'error',
        rowsAffected,
        error
      };

      this.queryMetrics.push(metric);
      
      // Keep only recent metrics
      if (this.queryMetrics.length > this.maxMetricsHistory) {
        this.queryMetrics = this.queryMetrics.slice(-this.maxMetricsHistory);
      }

      // Check for slow queries
      if (duration > this.slowQueryThreshold) {
        this.handleSlowQuery(metric);
      }

      console.debug(`Query executed in ${duration}ms: ${metric.query.substring(0, 50)}...`);
    };
  }

  private sanitizeQuery(query: string): string {
    // Remove sensitive data and normalize query
    return query
      .replace(/\$\d+/g, '?') // Replace parameterized values
      .replace(/'\w+'/g, "'?'") // Replace string literals
      .replace(/\d+/g, '?') // Replace numbers
      .trim();
  }

  private handleSlowQuery(metric: QueryMetrics): void {
    const severity = metric.duration > this.criticalQueryThreshold ? 'critical' : 'medium';
    
    const alert: SlowQueryAlert = {
      query: metric.query,
      duration: metric.duration,
      threshold: severity === 'critical' ? this.criticalQueryThreshold : this.slowQueryThreshold,
      timestamp: metric.timestamp,
      severity: severity === 'critical' ? 'critical' : 'warning'
    };

    console.warn(`Slow query detected [${severity}]:`, alert);
    
    // Store slow query for analysis
    this.storeSlowQueryAlert(alert);
  }

  private async storeSlowQueryAlert(alert: SlowQueryAlert): Promise<void> {
    try {
      await supabase
        .from('performance_alerts')
        .insert({
          alert_type: 'slow_query',
          severity: alert.severity === 'warning' ? 'medium' : 'critical',
          message: `Slow query detected: ${alert.duration}ms`,
          metadata: {
            query: alert.query,
            duration: alert.duration,
            threshold: alert.threshold
          }
        });
    } catch (error) {
      console.error('Failed to store slow query alert:', error);
    }
  }

  private checkConnectionPool(): void {
    // Simulate connection pool monitoring
    // In a real implementation, this would connect to the database monitoring API
    const activeConnections = Math.floor(Math.random() * 20) + 5;
    const idleConnections = Math.floor(Math.random() * 10) + 2;
    const totalConnections = activeConnections + idleConnections;
    
    this.connectionStats = {
      activeConnections,
      idleConnections,
      totalConnections,
      maxConnections: 100,
      utilizationPercentage: (totalConnections / 100) * 100,
      averageWaitTime: Math.random() * 100,
      connectionErrors: 0
    };

    if (this.connectionStats.utilizationPercentage > 80) {
      console.warn('High connection pool utilization:', this.connectionStats.utilizationPercentage + '%');
    }
  }

  private analyzeSlowQueries(): void {
    const recentQueries = this.queryMetrics.filter(
      metric => Date.now() - metric.timestamp.getTime() < 300000 // Last 5 minutes
    );

    const slowQueries = recentQueries.filter(
      metric => metric.duration > this.slowQueryThreshold
    );

    if (slowQueries.length > 5) {
      console.warn(`High number of slow queries detected: ${slowQueries.length} in the last 5 minutes`);
    }

    // Identify most common slow query patterns
    const queryPatterns = new Map<string, number>();
    slowQueries.forEach(query => {
      const pattern = query.query.substring(0, 100);
      queryPatterns.set(pattern, (queryPatterns.get(pattern) || 0) + 1);
    });

    for (const [pattern, count] of queryPatterns) {
      if (count > 2) {
        console.warn(`Repeated slow query pattern (${count} times):`, pattern);
      }
    }
  }

  private cleanupOldMetrics(): void {
    const oneHourAgo = Date.now() - 3600000;
    this.queryMetrics = this.queryMetrics.filter(
      metric => metric.timestamp.getTime() > oneHourAgo
    );
  }

  public getPerformanceMetrics(): {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
    errorRate: number;
    connectionStats: ConnectionPoolStats;
  } {
    const recentQueries = this.queryMetrics.filter(
      metric => Date.now() - metric.timestamp.getTime() < 300000 // Last 5 minutes
    );

    const totalQueries = recentQueries.length;
    const averageQueryTime = totalQueries > 0 
      ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries 
      : 0;
    const slowQueries = recentQueries.filter(q => q.duration > this.slowQueryThreshold).length;
    const errorQueries = recentQueries.filter(q => q.status === 'error').length;
    const errorRate = totalQueries > 0 ? (errorQueries / totalQueries) * 100 : 0;

    return {
      totalQueries,
      averageQueryTime,
      slowQueries,
      errorRate,
      connectionStats: { ...this.connectionStats }
    };
  }

  public getTopSlowQueries(limit: number = 10): QueryMetrics[] {
    return [...this.queryMetrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  public optimizeQuery(query: string): string[] {
    const suggestions: string[] = [];
    
    // Basic query optimization suggestions
    if (!query.includes('LIMIT') && (query.includes('SELECT') && !query.includes('COUNT'))) {
      suggestions.push('Consider adding LIMIT clause to prevent large result sets');
    }
    
    if (query.includes('SELECT *')) {
      suggestions.push('Avoid SELECT *, specify only needed columns');
    }
    
    if (query.includes('WHERE') && !query.includes('INDEX')) {
      suggestions.push('Ensure WHERE clause columns are indexed');
    }
    
    if (query.includes('ORDER BY') && !query.includes('LIMIT')) {
      suggestions.push('ORDER BY without LIMIT can be expensive on large datasets');
    }

    return suggestions;
  }
}

export const databasePerformanceAnalyzer = DatabasePerformanceAnalyzer.getInstance();
