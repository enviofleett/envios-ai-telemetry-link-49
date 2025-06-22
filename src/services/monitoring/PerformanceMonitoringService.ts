
import { supabase } from '@/integrations/supabase/client';

export interface SyncPerformanceMetric {
  syncOperationId?: string;
  operationType: 'vehicle_sync' | 'user_sync' | 'data_fetch';
  operationDurationMs: number;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  apiCallsMade: number;
  memoryUsageMb?: number;
  cpuUsagePercent?: number;
  networkLatencyMs?: number;
  errorDetails?: Record<string, any>;
  metadata?: Record<string, any>;
  startedAt: Date;
  completedAt: Date;
}

export interface PerformanceMetrics {
  averageOperationTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  latestOperations: any[];
  performanceTrends: any[];
}

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private activeOperations: Map<string, { startTime: Date; metadata: any }> = new Map();

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  startOperation(operationId: string, operationType: string, metadata: any = {}): void {
    this.activeOperations.set(operationId, {
      startTime: new Date(),
      metadata: { operationType, ...metadata }
    });
    console.log(`📊 Started monitoring operation: ${operationId} (${operationType})`);
  }

  async completeOperation(
    operationId: string,
    results: {
      recordsProcessed: number;
      recordsSuccessful: number;
      recordsFailed: number;
      apiCallsMade?: number;
      errorDetails?: any;
    }
  ): Promise<void> {
    const operation = this.activeOperations.get(operationId);
    if (!operation) {
      console.warn(`⚠️ No active operation found for ID: ${operationId}`);
      return;
    }

    const completedAt = new Date();
    const operationDurationMs = completedAt.getTime() - operation.startTime.getTime();

    try {
      const metric: SyncPerformanceMetric = {
        syncOperationId: operationId,
        operationType: operation.metadata.operationType,
        operationDurationMs,
        recordsProcessed: results.recordsProcessed,
        recordsSuccessful: results.recordsSuccessful,
        recordsFailed: results.recordsFailed,
        apiCallsMade: results.apiCallsMade || 0,
        errorDetails: results.errorDetails,
        metadata: operation.metadata,
        startedAt: operation.startTime,
        completedAt
      };

      await this.storePerformanceMetric(metric);
      
      this.activeOperations.delete(operationId);
      
      console.log(`✅ Completed monitoring operation: ${operationId} (${operationDurationMs}ms)`);
    } catch (error) {
      console.error('❌ Failed to store performance metric:', error);
    }
  }

  private async storePerformanceMetric(metric: SyncPerformanceMetric): Promise<void> {
    try {
      const { error } = await supabase
        .from('sync_performance_metrics')
        .insert({
          sync_operation_id: metric.syncOperationId,
          operation_type: metric.operationType,
          operation_duration_ms: metric.operationDurationMs,
          records_processed: metric.recordsProcessed,
          records_successful: metric.recordsSuccessful,
          records_failed: metric.recordsFailed,
          api_calls_made: metric.apiCallsMade,
          memory_usage_mb: metric.memoryUsageMb,
          cpu_usage_percent: metric.cpuUsagePercent,
          network_latency_ms: metric.networkLatencyMs,
          error_details: metric.errorDetails,
          metadata: metric.metadata,
          started_at: metric.startedAt.toISOString(),
          completed_at: metric.completedAt.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('❌ Failed to store performance metric:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const { data: metrics, error } = await supabase
        .from('sync_performance_metrics')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!metrics || metrics.length === 0) {
        return {
          averageOperationTime: 0,
          successRate: 0,
          errorRate: 0,
          throughput: 0,
          latestOperations: [],
          performanceTrends: []
        };
      }

      const averageOperationTime = metrics.reduce((sum, m) => sum + m.operation_duration_ms, 0) / metrics.length;
      const totalRecords = metrics.reduce((sum, m) => sum + m.records_processed, 0);
      const successfulRecords = metrics.reduce((sum, m) => sum + m.records_successful, 0);
      const failedRecords = metrics.reduce((sum, m) => sum + m.records_failed, 0);
      
      const successRate = totalRecords > 0 ? (successfulRecords / totalRecords) * 100 : 0;
      const errorRate = totalRecords > 0 ? (failedRecords / totalRecords) * 100 : 0;
      const throughput = totalRecords / (7 * 24); // Records per hour over 7 days

      return {
        averageOperationTime: Math.round(averageOperationTime),
        successRate: Math.round(successRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        throughput: Math.round(throughput * 100) / 100,
        latestOperations: metrics.slice(0, 10),
        performanceTrends: [] // TODO: Implement trend analysis
      };
    } catch (error) {
      console.error('❌ Failed to get performance metrics:', error);
      return {
        averageOperationTime: 0,
        successRate: 0,
        errorRate: 0,
        throughput: 0,
        latestOperations: [],
        performanceTrends: []
      };
    }
  }

  async recordSystemMetric(
    metricType: string,
    metricValue: number,
    metricUnit: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_health_metrics')
        .insert({
          metric_type: metricType,
          metric_value: metricValue,
          metric_unit: metricUnit,
          metadata
        });

      if (error) throw error;
    } catch (error) {
      console.error('❌ Failed to record system metric:', error);
    }
  }
}

export const performanceMonitoringService = PerformanceMonitoringService.getInstance();
