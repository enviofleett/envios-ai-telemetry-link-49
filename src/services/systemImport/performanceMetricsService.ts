export class PerformanceMetricsService {
  private startTime: number | null = null;
  private currentPhase: string | null = null;
  private processedRecords = 0;
  private errorCount = 0;
  private currentImportId: string | null = null;
  private phaseStartTimes: Record<string, number> = {};
  private networkLatencies: number[] = [];
  private memoryUsageSamples: number[] = [];
  private processingTimes: number[] = [];
  private lastProgressUpdate: number = 0;
  private progressUpdateInterval = 2000; // 2 seconds
  private metricsHistory: any[] = [];

  startMonitoring(importId: string): void {
    this.currentImportId = importId;
    this.startTime = Date.now();
    this.processedRecords = 0;
    this.errorCount = 0;
    this.phaseStartTimes = {};
    this.networkLatencies = [];
    this.memoryUsageSamples = [];
    this.processingTimes = [];
    this.lastProgressUpdate = Date.now();
    console.log('Performance monitoring started for import:', importId);
    
    // Start memory sampling if available
    if ('memory' in performance) {
      this.sampleMemoryUsage();
    }
  }

  setPhase(phase: string): void {
    if (this.currentPhase && this.phaseStartTimes[this.currentPhase]) {
      // Record duration of previous phase
      const phaseDuration = Date.now() - this.phaseStartTimes[this.currentPhase];
      this.metricsHistory.push({
        importId: this.currentImportId,
        phase: this.currentPhase,
        duration: phaseDuration,
        timestamp: new Date().toISOString(),
        records: this.processedRecords
      });
    }
    
    this.currentPhase = phase;
    this.phaseStartTimes[phase] = Date.now();
    console.log(`Performance phase set to: ${phase}`);
  }

  recordProcessedRecords(count: number): void {
    this.processedRecords += count;
    
    // Only log progress at reasonable intervals to avoid console spam
    const now = Date.now();
    if (now - this.lastProgressUpdate > this.progressUpdateInterval) {
      this.lastProgressUpdate = now;
      
      if (this.startTime) {
        const elapsedSeconds = (now - this.startTime) / 1000;
        const recordsPerSecond = this.processedRecords / elapsedSeconds;
        console.log(`Processing rate: ${recordsPerSecond.toFixed(2)} records/sec (${this.processedRecords} total)`);
      }
    }
  }

  recordError(): void {
    this.errorCount++;
  }

  recordNetworkLatency(latency: number): void {
    this.networkLatencies.push(latency);
    
    // Calculate and log average latency periodically
    if (this.networkLatencies.length % 10 === 0) {
      const avgLatency = this.networkLatencies.reduce((sum, val) => sum + val, 0) / this.networkLatencies.length;
      console.log(`Average network latency: ${avgLatency.toFixed(2)}ms (${this.networkLatencies.length} samples)`);
    }
  }

  recordProcessingTime(operation: string, timeMs: number): void {
    this.processingTimes.push(timeMs);
    
    // Log slow operations
    if (timeMs > 1000) {
      console.warn(`Slow operation detected: ${operation} took ${timeMs}ms`);
    }
  }

  private sampleMemoryUsage(): void {
    if (!('memory' in performance)) return;
    
    const memoryInterval = setInterval(() => {
      if (!this.startTime) {
        clearInterval(memoryInterval);
        return;
      }
      
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      this.memoryUsageSamples.push(usagePercent);
      
      // Log high memory usage
      if (usagePercent > 80) {
        console.warn(`High memory usage: ${usagePercent.toFixed(1)}%`);
      }
    }, 30000); // Sample every 30 seconds
  }

  stopMonitoring(): void {
    // Record final phase metrics
    if (this.currentPhase && this.phaseStartTimes[this.currentPhase]) {
      const phaseDuration = Date.now() - this.phaseStartTimes[this.currentPhase];
      this.metricsHistory.push({
        importId: this.currentImportId,
        phase: this.currentPhase,
        duration: phaseDuration,
        timestamp: new Date().toISOString(),
        records: this.processedRecords,
        final: true
      });
    }
    
    // Log final performance summary
    if (this.startTime) {
      const totalDuration = Date.now() - this.startTime;
      const recordsPerSecond = this.processedRecords / (totalDuration / 1000);
      
      console.log('Performance monitoring stopped');
      console.log(`Total duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
      console.log(`Total records processed: ${this.processedRecords}`);
      console.log(`Processing rate: ${recordsPerSecond.toFixed(2)} records/second`);
      console.log(`Error rate: ${(this.errorCount / Math.max(1, this.processedRecords) * 100).toFixed(2)}%`);
      
      if (this.memoryUsageSamples.length > 0) {
        const avgMemory = this.memoryUsageSamples.reduce((sum, val) => sum + val, 0) / this.memoryUsageSamples.length;
        console.log(`Average memory usage: ${avgMemory.toFixed(1)}%`);
      }
    }
    
    this.currentImportId = null;
    this.startTime = null;
    this.currentPhase = null;
  }

  async getMetricsForImport(importId: string): Promise<any> {
    // Filter metrics history for this import
    const importMetrics = this.metricsHistory.filter(m => m.importId === importId);
    
    // Calculate overall metrics
    const totalDuration = this.startTime ? Date.now() - this.startTime : 
      importMetrics.length > 0 ? 
        Math.max(...importMetrics.map(m => m.duration)) : 0;
    
    const phaseBreakdown = importMetrics.reduce((acc, metric) => {
      if (!acc[metric.phase]) {
        acc[metric.phase] = { duration: 0, records: 0 };
      }
      acc[metric.phase].duration += metric.duration;
      acc[metric.phase].records = Math.max(acc[metric.phase].records, metric.records);
      return acc;
    }, {});
    
    return {
      importId,
      totalDuration,
      processedRecords: this.processedRecords,
      errorCount: this.errorCount,
      averageRecordsPerSecond: totalDuration > 0 ? 
        this.processedRecords / (totalDuration / 1000) : 0,
      networkLatency: this.networkLatencies.length > 0 ? {
        average: this.networkLatencies.reduce((sum, val) => sum + val, 0) / this.networkLatencies.length,
        min: Math.min(...this.networkLatencies),
        max: Math.max(...this.networkLatencies)
      } : null,
      memoryUsage: this.memoryUsageSamples.length > 0 ? {
        average: this.memoryUsageSamples.reduce((sum, val) => sum + val, 0) / this.memoryUsageSamples.length,
        peak: Math.max(...this.memoryUsageSamples)
      } : null,
      phaseBreakdown
    };
  }

  async getHistoricalMetrics(days: number): Promise<any> {
    // In a real implementation, this would fetch metrics from a database
    // For now, we'll return a placeholder with some calculated metrics
    
    const recentImports = [...new Set(this.metricsHistory.map(m => m.importId))].filter(Boolean);
    
    return {
      period: `${days} days`,
      totalImports: recentImports.length,
      averageDuration: this.metricsHistory.length > 0 ? 
        this.metricsHistory.reduce((sum, m) => sum + m.duration, 0) / this.metricsHistory.length : 0,
      successRate: this.errorCount > 0 ? 
        (1 - (this.errorCount / Math.max(1, this.processedRecords))) * 100 : 100,
      recentImports: recentImports.slice(0, 5),
      totalRecordsProcessed: this.processedRecords
    };
  }

  getCurrentSnapshot(): any {
    const currentDuration = this.startTime ? Date.now() - this.startTime : 0;
    const recordsPerSecond = currentDuration > 0 ? 
      this.processedRecords / (currentDuration / 1000) : 0;
    
    return {
      currentPhase: this.currentPhase,
      processedRecords: this.processedRecords,
      errorCount: this.errorCount,
      duration: currentDuration,
      recordsPerSecond,
      memoryUsage: this.memoryUsageSamples.length > 0 ? 
        this.memoryUsageSamples[this.memoryUsageSamples.length - 1] : null,
      networkLatency: this.networkLatencies.length > 0 ?
        this.networkLatencies.slice(-5).reduce((sum, val) => sum + val, 0) / 
        Math.min(5, this.networkLatencies.length) : null
    };
  }
}

export const performanceMetricsService = new PerformanceMetricsService();
