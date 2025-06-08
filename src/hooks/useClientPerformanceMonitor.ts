
import { useEffect, useState } from 'react';
import { clientPerformanceMonitor, PerformanceMetrics, ComponentPerformance } from '@/services/performance/ClientPerformanceMonitor';

export const useClientPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [componentMetrics, setComponentMetrics] = useState<ComponentPerformance[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    // Initialize performance monitoring
    clientPerformanceMonitor.initialize();

    // Update metrics periodically - reduced frequency for production
    const interval = setInterval(() => {
      setMetrics(clientPerformanceMonitor.getMetrics());
      setComponentMetrics(clientPerformanceMonitor.getComponentMetrics());
      setSummary(clientPerformanceMonitor.getPerformanceSummary());
    }, 10000); // Increased from 5000 to 10000

    return () => {
      clearInterval(interval);
      clientPerformanceMonitor.cleanup();
    };
  }, []);

  const trackComponentRender = (componentName: string, renderTime: number) => {
    // Only track in development to reduce production overhead
    if (process.env.NODE_ENV === 'development') {
      clientPerformanceMonitor.trackComponentRender(componentName, renderTime);
    }
  };

  return {
    metrics,
    componentMetrics,
    summary,
    trackComponentRender
  };
};
