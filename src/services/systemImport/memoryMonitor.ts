
export class ImportMemoryMonitor {
  private isActive = false;
  private intervalId: number | null = null;
  private alertCallback: ((alert: { message: string; usage: number }) => void) | null = null;

  startMonitoring(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log('Starting memory monitoring...');
    
    this.intervalId = window.setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        
        if (usagePercent > 80 && this.alertCallback) {
          this.alertCallback({
            message: `High memory usage detected: ${usagePercent.toFixed(1)}%`,
            usage: usagePercent
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  onAlert(callback: (alert: { message: string; usage: number }) => void): void {
    this.alertCallback = callback;
  }

  isMonitoringActive(): boolean {
    return this.isActive;
  }

  getMemorySummary(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return { error: 'Memory API not available' };
  }

  cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isActive = false;
    this.alertCallback = null;
    console.log('Memory monitoring stopped');
  }
}

export const importMemoryMonitor = new ImportMemoryMonitor();
