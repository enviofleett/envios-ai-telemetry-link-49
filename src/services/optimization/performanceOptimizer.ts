interface OptimizationSettings {
  syncIntervals: {
    positionOnly: number; // milliseconds
    fullSync: number; // milliseconds
    healthCheck: number; // milliseconds
  };
  retrySettings: {
    maxRetries: number;
    baseDelay: number; // milliseconds
    maxDelay: number; // milliseconds
    backoffMultiplier: number;
  };
  dataThresholds: {
    stalenessWarning: number; // minutes
    stalenessError: number; // minutes
    maxErrorCount: number;
    minSuccessRate: number; // 0-1
  };
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private settings: OptimizationSettings = {
    syncIntervals: {
      positionOnly: 15000, // 15 seconds for active vehicles
      fullSync: 30000, // 30 seconds for complete sync
      healthCheck: 120000, // 2 minutes for health checks
    },
    retrySettings: {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffMultiplier: 2,
    },
    dataThresholds: {
      stalenessWarning: 2, // 2 minutes
      stalenessError: 5, // 5 minutes
      maxErrorCount: 5,
      minSuccessRate: 0.8, // 80%
    }
  };

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string = 'Unknown Operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.settings.retrySettings.maxRetries; attempt++) {
      try {
        console.log(`🔄 Executing ${operationName} (attempt ${attempt}/${this.settings.retrySettings.maxRetries})`);
        
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`❌ ${operationName} failed on attempt ${attempt}:`, lastError.message);
        
        if (attempt < this.settings.retrySettings.maxRetries) {
          const delay = this.calculateBackoffDelay(attempt);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        }
      }
    }
    
    console.error(`🚨 ${operationName} failed after ${this.settings.retrySettings.maxRetries} attempts`);
    throw lastError!;
  }

  private calculateBackoffDelay(attempt: number): number {
    const delay = this.settings.retrySettings.baseDelay * 
      Math.pow(this.settings.retrySettings.backoffMultiplier, attempt - 1);
    
    return Math.min(delay, this.settings.retrySettings.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getOptimalSyncInterval(vehicleCount: number, systemLoad: 'low' | 'medium' | 'high'): number {
    const baseInterval = this.settings.syncIntervals.positionOnly;
    
    // Adjust based on vehicle count
    let interval = baseInterval;
    if (vehicleCount > 100) {
      interval = baseInterval * 1.5;
    } else if (vehicleCount > 50) {
      interval = baseInterval * 1.2;
    }
    
    // Adjust based on system load
    switch (systemLoad) {
      case 'high':
        interval *= 2;
        break;
      case 'medium':
        interval *= 1.5;
        break;
      case 'low':
      default:
        // Keep original interval
        break;
    }
    
    return Math.max(interval, 10000); // Minimum 10 seconds
  }

  isDataStale(lastUpdate: string | Date, warningLevel: boolean = false): boolean {
    const updateTime = new Date(lastUpdate);
    const now = new Date();
    const minutesDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60);
    
    const threshold = warningLevel ? 
      this.settings.dataThresholds.stalenessWarning : 
      this.settings.dataThresholds.stalenessError;
    
    return minutesDiff > threshold;
  }

  shouldTriggerAlert(errorCount: number, successRate: number): boolean {
    return errorCount >= this.settings.dataThresholds.maxErrorCount || 
           successRate < this.settings.dataThresholds.minSuccessRate;
  }

  optimizePollingStrategy(recentErrors: number, successRate: number): {
    positionInterval: number;
    fullSyncInterval: number;
    shouldReduceLoad: boolean;
  } {
    const shouldReduceLoad = this.shouldTriggerAlert(recentErrors, successRate);
    
    let positionInterval = this.settings.syncIntervals.positionOnly;
    let fullSyncInterval = this.settings.syncIntervals.fullSync;
    
    if (shouldReduceLoad) {
      // Increase intervals to reduce load when having issues
      positionInterval *= 2;
      fullSyncInterval *= 1.5;
      console.log('🐌 Reducing polling frequency due to errors');
    } else if (successRate > 0.95 && recentErrors === 0) {
      // Slightly decrease intervals when performance is excellent
      positionInterval = Math.max(positionInterval * 0.8, 10000);
      fullSyncInterval = Math.max(fullSyncInterval * 0.9, 20000);
      console.log('🚀 Optimizing polling frequency for excellent performance');
    }
    
    return {
      positionInterval,
      fullSyncInterval,
      shouldReduceLoad
    };
  }

  getSettings(): OptimizationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<OptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    console.log('⚙️ Performance optimization settings updated');
  }
}

export const performanceOptimizer = PerformanceOptimizer.getInstance();
