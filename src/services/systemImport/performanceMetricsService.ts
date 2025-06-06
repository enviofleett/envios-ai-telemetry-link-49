
import { supabase } from '@/integrations/supabase/client';
import { importLogger } from './importLogger';

export interface PerformanceMetric {
  type: 'throughput' | 'memory_usage' | 'network_latency' | 'db_performance' | 'phase_duration' | 'error_rate';
  value: number;
  unit: string;
  timestamp: Date;
  phase?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceSnapshot {
  importId: string;
  throughput: number; // records/second
  memoryUsage: number; // MB
  networkLatency: number; // ms
  dbPerformance: number; // ms
  errorRate: number; // percentage
  currentPhase: string;
  timestamp: Date;
}

class PerformanceMetricsService {
  private importId: string | null = null;
  private startTime: Date | null = null;
  private phaseStartTime: Date | null = null;
  private currentPhase: string | null = null;
  private recordsProcessed = 0;
  private errors = 0;
  private totalOperations = 0;

  public startMonitoring(importId: string): void {
    this.importId = importId;
    this.startTime = new Date();
    this.phaseStartTime = new Date();
    this.recordsProcessed = 0;
    this.errors = 0;
    this.totalOperations = 0;
    
    importLogger.info('performance', 'Performance monitoring started', { importId });
    
    // Start periodic metric collection
    this.startPeriodicCollection();
  }

  public stopMonitoring(): void {
    if (this.importId && this.startTime) {
      const totalDuration = Date.now() - this.startTime.getTime();
      this.recordMetric({
        type: 'phase_duration',
        value: totalDuration,
        unit: 'ms',
        timestamp: new Date(),
        phase: 'total_import',
        metadata: {
          totalRecords: this.recordsProcessed,
          totalErrors: this.errors,
          avgThroughput: this.recordsProcessed / (totalDuration / 1000)
        }
      });
    }
    
    this.importId = null;
    this.startTime = null;
    this.phaseStartTime = null;
    this.currentPhase = null;
    
    importLogger.info('performance', 'Performance monitoring stopped');
  }

  public setPhase(phase: string): void {
    if (this.currentPhase && this.phaseStartTime) {
      // Record the previous phase duration
      const phaseDuration = Date.now() - this.phaseStartTime.getTime();
      this.recordMetric({
        type: 'phase_duration',
        value: phaseDuration,
        unit: 'ms',
        timestamp: new Date(),
        phase: this.currentPhase,
        metadata: {
          recordsInPhase: this.recordsProcessed
        }
      });
    }
    
    this.currentPhase = phase;
    this.phaseStartTime = new Date();
    
    importLogger.debug('performance', `Phase changed to: ${phase}`);
  }

  public recordProcessedRecords(count: number): void {
    this.recordsProcessed += count;
    this.totalOperations += count;
    
    // Calculate current throughput
    if (this.startTime) {
      const elapsed = (Date.now() - this.startTime.getTime()) / 1000;
      const throughput = this.recordsProcessed / elapsed;
      
      this.recordMetric({
        type: 'throughput',
        value: throughput,
        unit: 'records/second',
        timestamp: new Date(),
        phase: this.currentPhase || 'unknown'
      });
    }
  }

  public recordError(): void {
    this.errors++;
    this.totalOperations++;
    
    // Calculate error rate
    const errorRate = (this.errors / this.totalOperations) * 100;
    this.recordMetric({
      type: 'error_rate',
      value: errorRate,
      unit: 'percentage',
      timestamp: new Date(),
      phase: this.currentPhase || 'unknown'
    });
  }

  public recordNetworkLatency(latency: number): void {
    this.recordMetric({
      type: 'network_latency',
      value: latency,
      unit: 'ms',
      timestamp: new Date(),
      phase: this.currentPhase || 'unknown'
    });
  }

  public recordDatabasePerformance(duration: number): void {
    this.recordMetric({
      type: 'db_performance',
      value: duration,
      unit: 'ms',
      timestamp: new Date(),
      phase: this.currentPhase || 'unknown'
    });
  }

  private async recordMetric(metric: PerformanceMetric): Promise<void> {
    if (!this.importId) return;

    try {
      await supabase
        .from('import_performance_metrics')
        .insert({
          import_id: this.importId,
          metric_type: metric.type,
          metric_value: metric.value,
          metric_data: {
            unit: metric.unit,
            metadata: metric.metadata || {}
          },
          phase: metric.phase,
          timestamp: metric.timestamp.toISOString()
        });
    } catch (error) {
      importLogger.error('performance', 'Failed to record metric', { error, metric });
    }
  }

  private startPeriodicCollection(): void {
    if (!this.importId) return;

    const collectMetrics = () => {
      if (!this.importId) return;

      // Collect memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsageMB = memory.usedJSHeapSize / 1024 / 1024;
        
        this.recordMetric({
          type: 'memory_usage',
          value: memoryUsageMB,
          unit: 'MB',
          timestamp: new Date(),
          phase: this.currentPhase || 'unknown',
          metadata: {
            totalHeapSize: memory.totalJSHeapSize / 1024 / 1024,
            heapLimit: memory.jsHeapSizeLimit / 1024 / 1024
          }
        });
      }

      // Schedule next collection
      setTimeout(collectMetrics, 10000); // Every 10 seconds
    };

    // Start collecting
    setTimeout(collectMetrics, 1000);
  }

  public async getMetricsForImport(importId: string): Promise<PerformanceMetric[]> {
    try {
      const { data, error } = await supabase
        .from('import_performance_metrics')
        .select('*')
        .eq('import_id', importId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      return data.map(row => ({
        type: row.metric_type as any,
        value: Number(row.metric_value),
        unit: row.metric_data?.unit || '',
        timestamp: new Date(row.timestamp),
        phase: row.phase || undefined,
        metadata: row.metric_data?.metadata || {}
      }));
    } catch (error) {
      importLogger.error('performance', 'Failed to fetch metrics', { error, importId });
      return [];
    }
  }

  public getCurrentSnapshot(): PerformanceSnapshot | null {
    if (!this.importId || !this.startTime) return null;

    const elapsed = (Date.now() - this.startTime.getTime()) / 1000;
    const throughput = this.recordsProcessed / elapsed;
    const errorRate = this.totalOperations > 0 ? (this.errors / this.totalOperations) * 100 : 0;

    // Get current memory usage
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = memory.usedJSHeapSize / 1024 / 1024;
    }

    return {
      importId: this.importId,
      throughput,
      memoryUsage,
      networkLatency: 0, // Would be calculated from recent measurements
      dbPerformance: 0, // Would be calculated from recent measurements
      errorRate,
      currentPhase: this.currentPhase || 'unknown',
      timestamp: new Date()
    };
  }

  public async getHistoricalMetrics(days: number = 7): Promise<Array<{
    date: string;
    avgThroughput: number;
    avgMemoryUsage: number;
    avgErrorRate: number;
    totalImports: number;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('import_performance_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date and calculate averages
      const dailyMetrics = new Map();
      
      data.forEach(metric => {
        const date = new Date(metric.created_at).toISOString().split('T')[0];
        if (!dailyMetrics.has(date)) {
          dailyMetrics.set(date, {
            date,
            throughput: [],
            memoryUsage: [],
            errorRate: [],
            imports: new Set()
          });
        }
        
        const day = dailyMetrics.get(date);
        if (metric.import_id) day.imports.add(metric.import_id);
        
        switch (metric.metric_type) {
          case 'throughput':
            day.throughput.push(Number(metric.metric_value));
            break;
          case 'memory_usage':
            day.memoryUsage.push(Number(metric.metric_value));
            break;
          case 'error_rate':
            day.errorRate.push(Number(metric.metric_value));
            break;
        }
      });

      return Array.from(dailyMetrics.values()).map(day => ({
        date: day.date,
        avgThroughput: day.throughput.length ? day.throughput.reduce((a, b) => a + b, 0) / day.throughput.length : 0,
        avgMemoryUsage: day.memoryUsage.length ? day.memoryUsage.reduce((a, b) => a + b, 0) / day.memoryUsage.length : 0,
        avgErrorRate: day.errorRate.length ? day.errorRate.reduce((a, b) => a + b, 0) / day.errorRate.length : 0,
        totalImports: day.imports.size
      }));
    } catch (error) {
      importLogger.error('performance', 'Failed to fetch historical metrics', { error });
      return [];
    }
  }
}

export const performanceMetricsService = new PerformanceMetricsService();
