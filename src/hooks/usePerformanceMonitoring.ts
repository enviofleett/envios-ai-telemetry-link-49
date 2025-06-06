
import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  queryCount: number;
  cacheSize: number;
  reRenderCount: number;
}

export const usePerformanceMonitoring = (componentName: string) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    queryCount: 0,
    cacheSize: 0,
    reRenderCount: 0
  });
  
  const renderCount = useRef(0);
  const renderStartTime = useRef(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        reRenderCount: renderCount.current,
        queryCount: queryClient.getQueryCache().getAll().length,
        cacheSize: queryClient.getQueryCache().getAll().reduce((size, query) => {
          try {
            return size + (JSON.stringify(query.state.data)?.length || 0);
          } catch {
            return size;
          }
        }, 0),
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      }));
    };
  });

  const logPerformanceWarning = (threshold: number = 100) => {
    if (metrics.renderTime > threshold) {
      console.warn(`${componentName} render time exceeded ${threshold}ms:`, metrics);
    }
  };

  return {
    metrics,
    logPerformanceWarning,
    isPerformanceCritical: metrics.renderTime > 100 || metrics.reRenderCount > 50
  };
};
