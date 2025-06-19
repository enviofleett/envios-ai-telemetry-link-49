import { useCallback, useRef, useEffect } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'api' | 'render' | 'navigation' | 'memory' | 'cache';
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    averageApiTime: number;
    averageRenderTime: number;
    memoryUsage: number;
    cacheHitRate: number;
  };
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private observer: PerformanceObserver | null = null;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private constructor() {
    this.initializeObserver();
  }

  private initializeObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.addMetric({
            name: entry.name,
            value: entry.duration || entry.startTime,
            timestamp: Date.now(),
            category: this.categorizeEntry(entry)
          });
        });
      });

      this.observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    }
  }

  private categorizeEntry(entry: PerformanceEntry): PerformanceMetric['category'] {
    if (entry.entryType === 'navigation') return 'navigation';
    if (entry.entryType === 'resource') {
      if (entry.name.includes('api') || entry.name.includes('supabase')) {
        return 'api';
      }
    }
    return 'render';
  }

  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  measureApiCall<T>(name: string, apiCall: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    return apiCall().finally(() => {
      const endTime = performance.now();
      this.addMetric({
        name,
        value: endTime - startTime,
        timestamp: Date.now(),
        category: 'api'
      });
    });
  }

  measureRender(name: string, renderFn: () => void): void {
    const startTime = performance.now();
    renderFn();
    const endTime = performance.now();
    
    this.addMetric({
      name,
      value: endTime - startTime,
      timestamp: Date.now(),
      category: 'render'
    });
  }

  getReport(): PerformanceReport {
    const apiMetrics = this.metrics.filter(m => m.category === 'api');
    const renderMetrics = this.metrics.filter(m => m.category === 'render');
    const cacheMetrics = this.metrics.filter(m => m.category === 'cache');

    const averageApiTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
      : 0;

    const averageRenderTime = renderMetrics.length > 0
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length
      : 0;

    const memoryUsage = this.getMemoryUsage();
    const cacheHitRate = this.calculateCacheHitRate(cacheMetrics);

    return {
      metrics: this.metrics.slice(-100), // Last 100 metrics
      summary: {
        averageApiTime,
        averageRenderTime,
        memoryUsage,
        cacheHitRate
      }
    };
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  private calculateCacheHitRate(cacheMetrics: PerformanceMetric[]): number {
    const hits = cacheMetrics.filter(m => m.name.includes('hit')).length;
    const total = cacheMetrics.length;
    return total > 0 ? (hits / total) * 100 : 0;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const usePerformanceMonitor = () => {
  const monitor = useRef(PerformanceMonitor.getInstance());

  const measureApiCall = useCallback(
    <T>(name: string, apiCall: () => Promise<T>) => 
      monitor.current.measureApiCall(name, apiCall),
    []
  );

  const measureRender = useCallback(
    (name: string, renderFn: () => void) => 
      monitor.current.measureRender(name, renderFn),
    []
  );

  const getReport = useCallback(
    () => monitor.current.getReport(),
    []
  );

  return {
    measureApiCall,
    measureRender,
    getReport
  };
};
