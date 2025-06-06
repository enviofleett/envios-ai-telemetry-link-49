interface MemoryMetrics {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  timestamp: number;
  componentCount?: number;
  activeSubscriptions?: number;
}

interface MemoryAlert {
  type: 'memory_leak' | 'high_usage' | 'gc_pressure';
  message: string;
  metrics: MemoryMetrics;
  timestamp: number;
}

export class ImportMemoryMonitor {
  private metrics: MemoryMetrics[] = [];
  private maxMetrics = 100;
  private monitoringInterval: number | null = null;
  private alertThresholds = {
    memoryLeakGrowth: 50 * 1024 * 1024, // 50MB growth over 5 minutes
    highUsagePercent: 85, // 85% of heap limit
    gcPressureThreshold: 0.1 // 10% heap size changes
  };
  private alertCallbacks: Array<(alert: MemoryAlert) => void> = [];
  private isMonitoring = false;

  public startMonitoring(intervalMs: number = 30000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    console.log('Starting import memory monitoring...');
    this.isMonitoring = true;
    
    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics();
      this.analyzeMemoryPatterns();
      this.performGarbageCollection();
    }, intervalMs);

    // Initial collection
    this.collectMetrics();
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      console.log('Import memory monitoring stopped');
    }
  }

  private collectMetrics(): void {
    if (!('memory' in performance)) {
      console.warn('Performance memory API not available');
      return;
    }

    const memory = (performance as any).memory;
    const componentCount = this.getComponentCount();
    const activeSubscriptions = this.getActiveSubscriptions();

    const metrics: MemoryMetrics = {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      timestamp: Date.now(),
      componentCount,
      activeSubscriptions
    };

    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    console.debug('Import memory metrics:', {
      used: `${(metrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      total: `${(metrics.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      usage: `${((metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100).toFixed(1)}%`,
      components: componentCount,
      subscriptions: activeSubscriptions
    });
  }

  private analyzeMemoryPatterns(): void {
    if (this.metrics.length < 10) return;

    const recent = this.metrics.slice(-10);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    // Check for memory leaks (steady growth over time)
    const growth = newest.usedJSHeapSize - oldest.usedJSHeapSize;
    const timespan = newest.timestamp - oldest.timestamp;

    if (growth > this.alertThresholds.memoryLeakGrowth && timespan > 300000) { // 5 minutes
      this.triggerAlert({
        type: 'memory_leak',
        message: `Potential memory leak detected during import: ${(growth / 1024 / 1024).toFixed(2)}MB growth over ${(timespan / 60000).toFixed(1)} minutes`,
        metrics: newest,
        timestamp: Date.now()
      });
    }

    // Check for high memory usage
    const usagePercent = (newest.usedJSHeapSize / newest.jsHeapSizeLimit) * 100;
    if (usagePercent > this.alertThresholds.highUsagePercent) {
      this.triggerAlert({
        type: 'high_usage',
        message: `High memory usage during import: ${usagePercent.toFixed(1)}% of heap limit`,
        metrics: newest,
        timestamp: Date.now()
      });
    }
  }

  private performGarbageCollection(): void {
    // Force garbage collection if available (Chrome DevTools)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.debug('Manual garbage collection triggered during import');
      } catch (error) {
        console.debug('Manual garbage collection not available');
      }
    }
  }

  private getComponentCount(): number {
    // Estimate React component count by looking at DOM nodes with React properties
    const reactNodes = document.querySelectorAll('[data-reactroot], [data-react-*]');
    return reactNodes.length;
  }

  private getActiveSubscriptions(): number {
    // Count active subscriptions (query client, event listeners, etc.)
    let count = 0;
    
    // Count event listeners on window and document
    const windowEvents = (window as any)._events || {};
    const documentEvents = (document as any)._events || {};
    
    count += Object.keys(windowEvents).length;
    count += Object.keys(documentEvents).length;
    
    return count;
  }

  private triggerAlert(alert: MemoryAlert): void {
    console.warn('Import memory alert:', alert);
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in memory alert callback:', error);
      }
    });
  }

  public onAlert(callback: (alert: MemoryAlert) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      const index = this.alertCallbacks.indexOf(callback);
      if (index > -1) {
        this.alertCallbacks.splice(index, 1);
      }
    };
  }

  public getMetrics(): MemoryMetrics[] {
    return [...this.metrics];
  }

  public getCurrentMemoryUsage(): MemoryMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  public cleanup(): void {
    this.stopMonitoring();
    this.metrics = [];
    this.alertCallbacks = [];
    
    // Additional cleanup operations
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.log('Final garbage collection triggered after import');
      } catch (error) {
        console.debug('Manual garbage collection not available for cleanup');
      }
    }
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  public getMemorySummary() {
    if (this.metrics.length === 0) return null;

    const latest = this.metrics[this.metrics.length - 1];
    const earliest = this.metrics[0];
    
    return {
      currentUsage: `${(latest.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      totalGrowth: `${((latest.usedJSHeapSize - earliest.usedJSHeapSize) / 1024 / 1024).toFixed(2)}MB`,
      averageUsage: `${(this.metrics.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / this.metrics.length / 1024 / 1024).toFixed(2)}MB`,
      peakUsage: `${(Math.max(...this.metrics.map(m => m.usedJSHeapSize)) / 1024 / 1024).toFixed(2)}MB`,
      usagePercentage: `${((latest.usedJSHeapSize / latest.jsHeapSizeLimit) * 100).toFixed(1)}%`
    };
  }
}

export const importMemoryMonitor = new ImportMemoryMonitor();
