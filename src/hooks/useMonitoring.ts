
import { useState, useEffect } from 'react';
import { errorTrackingService, ErrorTrackingMetrics } from '@/services/monitoring/ErrorTrackingService';
import { performanceMonitoringService, PerformanceMetrics } from '@/services/monitoring/PerformanceMonitoringService';

export const useErrorTracking = () => {
  const [metrics, setMetrics] = useState<ErrorTrackingMetrics>({
    totalErrors: 0,
    errorsBySeverity: {},
    errorsBySource: {},
    recentErrors: [],
    errorTrends: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const data = await errorTrackingService.getErrorMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load error metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const reportError = async (
    errorType: string,
    errorSeverity: 'low' | 'medium' | 'high' | 'critical',
    errorMessage: string,
    errorSource: 'gp51_sync' | 'database' | 'api' | 'ui' | 'auth',
    errorContext?: Record<string, any>
  ) => {
    await errorTrackingService.reportError({
      errorType,
      errorSeverity,
      errorMessage,
      errorSource,
      errorContext
    });
    await loadMetrics();
  };

  const resolveError = async (errorId: string, resolutionNotes: string) => {
    await errorTrackingService.resolveError(errorId, resolutionNotes);
    await loadMetrics();
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return {
    metrics,
    isLoading,
    loadMetrics,
    reportError,
    resolveError
  };
};

export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    averageOperationTime: 0,
    successRate: 0,
    errorRate: 0,
    throughput: 0,
    latestOperations: [],
    performanceTrends: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const data = await performanceMonitoringService.getPerformanceMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startOperation = (operationId: string, operationType: string, metadata?: any) => {
    performanceMonitoringService.startOperation(operationId, operationType, metadata);
  };

  const completeOperation = async (
    operationId: string,
    results: {
      recordsProcessed: number;
      recordsSuccessful: number;
      recordsFailed: number;
      apiCallsMade?: number;
      errorDetails?: any;
    }
  ) => {
    await performanceMonitoringService.completeOperation(operationId, results);
    await loadMetrics();
  };

  const recordSystemMetric = async (
    metricType: string,
    metricValue: number,
    metricUnit: string,
    metadata?: Record<string, any>
  ) => {
    await performanceMonitoringService.recordSystemMetric(metricType, metricValue, metricUnit, metadata);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return {
    metrics,
    isLoading,
    loadMetrics,
    startOperation,
    completeOperation,
    recordSystemMetric
  };
};
