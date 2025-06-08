interface QueryMetrics {
  queryType: string;
  executionTime: number;
  timestamp: Date;
  table?: string;
  rowsAffected?: number;
}

interface PerformanceReport {
  averageQueryTime: number;
  slowQueries: QueryMetrics[];
  queryDistribution: Record<string, number>;
  totalQueries: number;
  timeRange: { start: Date; end: Date };
}

export class DatabasePerformanceAnalyzer {
  private static instance: DatabasePerformanceAnalyzer;
  private queryMetrics: QueryMetrics[] = [];
  private slowQueryThreshold = 1000; // 1 second
  private maxMetrics = 1000;

  static getInstance(): DatabasePerformanceAnalyzer {
    if (!DatabasePerformanceAnalyzer.instance) {
      DatabasePerformanceAnalyzer.instance = new DatabasePerformanceAnalyzer();
    }
    return DatabasePerformanceAnalyzer.instance;
  }

  trackQuery(
    queryType: string, 
    executionTime: number, 
    table?: string, 
    rowsAffected?: number
  ): void {
    const metric: QueryMetrics = {
      queryType,
      executionTime,
      timestamp: new Date(),
      table,
      rowsAffected
    };

    this.queryMetrics.push(metric);

    // Keep only recent metrics
    if (this.queryMetrics.length > this.maxMetrics) {
      this.queryMetrics = this.queryMetrics.slice(-this.maxMetrics);
    }

    // Log slow queries
    if (executionTime > this.slowQueryThreshold) {
      console.warn(`Slow query detected: ${queryType} on ${table} took ${executionTime}ms`);
    }
  }

  getPerformanceReport(hours: number = 24): PerformanceReport {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    const recentMetrics = this.queryMetrics.filter(
      metric => metric.timestamp >= cutoff
    );

    const totalTime = recentMetrics.reduce((sum, metric) => sum + metric.executionTime, 0);
    const averageQueryTime = recentMetrics.length > 0 ? totalTime / recentMetrics.length : 0;

    const slowQueries = recentMetrics
      .filter(metric => metric.executionTime > this.slowQueryThreshold)
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10); // Top 10 slowest

    const queryDistribution = recentMetrics.reduce((dist, metric) => {
      dist[metric.queryType] = (dist[metric.queryType] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      averageQueryTime: Math.round(averageQueryTime * 100) / 100,
      slowQueries,
      queryDistribution,
      totalQueries: recentMetrics.length,
      timeRange: {
        start: cutoff,
        end: new Date()
      }
    };
  }

  getPerformanceMetrics() {
    const report = this.getPerformanceReport();
    const recentMetrics = this.queryMetrics.slice(-100); // Last 100 queries
    
    const p95ExecutionTime = this.calculatePercentile(
      recentMetrics.map(m => m.executionTime), 
      95
    );
    
    const p99ExecutionTime = this.calculatePercentile(
      recentMetrics.map(m => m.executionTime), 
      99
    );

    return {
      ...report,
      p95ExecutionTime,
      p99ExecutionTime,
      healthScore: this.calculateHealthScore(report)
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private calculateHealthScore(report: PerformanceReport): number {
    let score = 100;

    // Deduct points for slow average query time
    if (report.averageQueryTime > 500) score -= 20;
    else if (report.averageQueryTime > 200) score -= 10;

    // Deduct points for slow queries
    const slowQueryRatio = report.slowQueries.length / report.totalQueries;
    if (slowQueryRatio > 0.1) score -= 30;
    else if (slowQueryRatio > 0.05) score -= 15;

    return Math.max(0, score);
  }

  clearMetrics(): void {
    this.queryMetrics = [];
  }

  setSlowQueryThreshold(milliseconds: number): void {
    this.slowQueryThreshold = milliseconds;
  }
}

export const databasePerformanceAnalyzer = DatabasePerformanceAnalyzer.getInstance();
