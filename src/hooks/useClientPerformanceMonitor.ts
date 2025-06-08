
import { useEffect, useState } from 'react';
import { clientPerformanceMonitor, PerformanceMetrics, ComponentPerformance } from '@/services/performance/ClientPerformanceMonitor';

export const useClientPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [componentMetrics, setComponentMetrics] = useState<ComponentPerformance[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // Initialize performance monitoring
    clientPerformanceMonitor.initialize();

    // Update metrics periodically
    const interval = setInterval(() => {
      setMetrics(clientPerformanceMonitor.getMetrics());
      setComponentMetrics(clientPerformanceMonitor.getComponentMetrics());
      setSummary(clientPerformanceMonitor.getPerformanceSummary());
    }, 5000);

    return () => {
      clearInterval(interval);
      clientPerformanceMonitor.cleanup();
    };
  }, []);

  const trackComponentRender = (componentName: string, renderTime: number) => {
    clientPerformanceMonitor.trackComponentRender(componentName, renderTime);
  };

  return {
    metrics,
    componentMetrics,
    summary,
    trackComponentRender
  };
};
