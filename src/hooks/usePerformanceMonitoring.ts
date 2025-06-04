
import { useEffect, useRef, useState, useCallback } from 'react';
import { memoryMonitor } from '@/services/memoryMonitoringService';

interface ComponentMetrics {
  renderCount: number;
  averageRenderTime: number;
  lastRenderTime: number;
  memoryUsageAtMount: number;
  memoryUsageCurrent: number;
}

interface PerformanceAlert {
  type: 'slow_render' | 'memory_growth' | 'excessive_renders';
  message: string;
  componentName: string;
  metrics: ComponentMetrics;
}

export function usePerformanceMonitoring(componentName: string, options?: {
  slowRenderThreshold?: number;
  maxRenders?: number;
  memoryGrowthThreshold?: number;
  onAlert?: (alert: PerformanceAlert) => void;
}) {
  const {
    slowRenderThreshold = 100, // ms
    maxRenders = 50, // renders per minute
    memoryGrowthThreshold = 10 * 1024 * 1024, // 10MB
    onAlert
  } = options || {};

  const renderTimesRef = useRef<number[]>([]);
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef<number>(Date.now());
  const lastRenderTimeRef = useRef<number>(0);
  const mountMemoryRef = useRef<number>(0);
  const renderStartTimeRef = useRef<number>(0);

  const [metrics, setMetrics] = useState<ComponentMetrics>({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0,
    memoryUsageAtMount: 0,
    memoryUsageCurrent: 0
  });

  // Track render start
  const markRenderStart = useCallback(() => {
    renderStartTimeRef.current = performance.now();
  }, []);

  // Track render end
  const markRenderEnd = useCallback(() => {
    const renderTime = performance.now() - renderStartTimeRef.current;
    renderCountRef.current++;
    lastRenderTimeRef.current = renderTime;

    // Store render times for averaging
    renderTimesRef.current.push(renderTime);
    if (renderTimesRef.current.length > 50) {
      renderTimesRef.current = renderTimesRef.current.slice(-50);
    }

    const averageRenderTime = renderTimesRef.current.reduce((sum, time) => sum + time, 0) / renderTimesRef.current.length;
    const currentMemory = memoryMonitor.getCurrentMemoryUsage();

    const newMetrics: ComponentMetrics = {
      renderCount: renderCountRef.current,
      averageRenderTime,
      lastRenderTime: renderTime,
      memoryUsageAtMount: mountMemoryRef.current,
      memoryUsageCurrent: currentMemory?.usedJSHeapSize || 0
    };

    setMetrics(newMetrics);

    // Check for performance issues
    checkPerformanceAlerts(newMetrics, renderTime);
  }, [componentName, slowRenderThreshold, maxRenders, memoryGrowthThreshold, onAlert]);

  const checkPerformanceAlerts = useCallback((currentMetrics: ComponentMetrics, renderTime: number) => {
    // Check for slow renders
    if (renderTime > slowRenderThreshold) {
      const alert: PerformanceAlert = {
        type: 'slow_render',
        message: `Slow render detected: ${renderTime.toFixed(2)}ms (threshold: ${slowRenderThreshold}ms)`,
        componentName,
        metrics: currentMetrics
      };
      onAlert?.(alert);
      console.warn(`Performance Alert [${componentName}]:`, alert);
    }

    // Check for excessive renders
    const timeWindow = 60000; // 1 minute
    const recentRenders = renderTimesRef.current.filter(time => 
      Date.now() - time < timeWindow
    ).length;

    if (recentRenders > maxRenders) {
      const alert: PerformanceAlert = {
        type: 'excessive_renders',
        message: `Excessive renders detected: ${recentRenders} renders in the last minute (max: ${maxRenders})`,
        componentName,
        metrics: currentMetrics
      };
      onAlert?.(alert);
      console.warn(`Performance Alert [${componentName}]:`, alert);
    }

    // Check for memory growth
    const memoryGrowth = currentMetrics.memoryUsageCurrent - currentMetrics.memoryUsageAtMount;
    if (memoryGrowth > memoryGrowthThreshold) {
      const alert: PerformanceAlert = {
        type: 'memory_growth',
        message: `Memory growth detected: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB since mount`,
        componentName,
        metrics: currentMetrics
      };
      onAlert?.(alert);
      console.warn(`Performance Alert [${componentName}]:`, alert);
    }
  }, [componentName, slowRenderThreshold, maxRenders, memoryGrowthThreshold, onAlert]);

  // Initialize memory tracking
  useEffect(() => {
    const currentMemory = memoryMonitor.getCurrentMemoryUsage();
    mountMemoryRef.current = currentMemory?.usedJSHeapSize || 0;
    mountTimeRef.current = Date.now();

    return () => {
      // Cleanup tracking data
      renderTimesRef.current = [];
      renderCountRef.current = 0;
    };
  }, []);

  // Auto-track renders
  useEffect(() => {
    markRenderStart();
    markRenderEnd();
  });

  const resetMetrics = useCallback(() => {
    renderTimesRef.current = [];
    renderCountRef.current = 0;
    setMetrics({
      renderCount: 0,
      averageRenderTime: 0,
      lastRenderTime: 0,
      memoryUsageAtMount: mountMemoryRef.current,
      memoryUsageCurrent: memoryMonitor.getCurrentMemoryUsage()?.usedJSHeapSize || 0
    });
  }, []);

  const getDetailedMetrics = useCallback(() => {
    const uptime = Date.now() - mountTimeRef.current;
    return {
      ...metrics,
      componentUptime: uptime,
      rendersPerMinute: (renderCountRef.current / (uptime / 60000)).toFixed(2),
      recentRenderTimes: renderTimesRef.current.slice(-10),
      performanceScore: calculatePerformanceScore(metrics)
    };
  }, [metrics]);

  return {
    metrics,
    markRenderStart,
    markRenderEnd,
    resetMetrics,
    getDetailedMetrics
  };
}

function calculatePerformanceScore(metrics: ComponentMetrics): number {
  let score = 100;

  // Penalize slow average render times
  if (metrics.averageRenderTime > 50) score -= 20;
  if (metrics.averageRenderTime > 100) score -= 30;

  // Penalize excessive renders
  if (metrics.renderCount > 100) score -= 15;
  if (metrics.renderCount > 200) score -= 25;

  // Penalize memory growth
  const memoryGrowth = metrics.memoryUsageCurrent - metrics.memoryUsageAtMount;
  if (memoryGrowth > 10 * 1024 * 1024) score -= 20; // 10MB
  if (memoryGrowth > 50 * 1024 * 1024) score -= 40; // 50MB

  return Math.max(0, score);
}
