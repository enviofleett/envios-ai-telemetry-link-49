import { DetailedSyncMetrics, createEmptyMetrics } from '@/services/vehiclePosition/detailedSyncMetrics';
import { TimestampConverter } from '@/services/vehiclePosition/timestampConverter';

export class LiveDataMonitor {
  private static instance: LiveDataMonitor;
  private metrics: DetailedSyncMetrics = createEmptyMetrics();
  private listeners: Set<(metrics: DetailedSyncMetrics) => void> = new Set();
  private alertThresholds = {
    staleDataMinutes: 30,
    maxErrorCount: 10,
    minSuccessRate: 0.8
  };

  static getInstance(): LiveDataMonitor {
    if (!LiveDataMonitor.instance) {
      LiveDataMonitor.instance = new LiveDataMonitor();
    }
    return LiveDataMonitor.instance;
  }

  // Timestamp conversion tracking
  recordTimestampConversion(success: boolean, isScientificNotation: boolean = false) {
    this.metrics.timestampConversions.total++;
    if (success) {
      this.metrics.timestampConversions.successful++;
      if (isScientificNotation) {
        this.metrics.timestampConversions.scientificNotationHandled++;
      }
    } else {
      this.metrics.timestampConversions.failed++;
      this.metrics.timestampConversions.invalidFormats++;
    }
    this.notifyListeners();
  }

  // Position validation tracking
  recordPositionValidation(position: any, isValid: boolean) {
    this.metrics.positionValidation.totalPositions++;
    
    if (isValid) {
      this.metrics.positionValidation.validPositions++;
      
      // Check data freshness
      const freshness = this.categorizeDataFreshness(position.updatetime);
      this.metrics.dataFreshness[freshness]++;
      
      if (freshness === 'stale' || freshness === 'offline') {
        this.metrics.positionValidation.stalePositions++;
      }
    } else {
      this.metrics.positionValidation.invalidPositions++;
      
      if (!position.lat || !position.lon) {
        this.metrics.positionValidation.missingCoordinates++;
      }
    }
    
    this.notifyListeners();
  }

  // Database operation tracking
  recordDatabaseOperation(success: boolean, error?: string) {
    this.metrics.databaseOps.totalAttempts++;
    
    if (success) {
      this.metrics.databaseOps.successful++;
    } else {
      this.metrics.databaseOps.failed++;
      this.metrics.errors.databaseErrors++;
      if (error) {
        this.addRecentError(`DB Error: ${error}`);
      }
    }
    
    this.notifyListeners();
  }

  // Performance tracking
  recordSyncPerformance(startTime: number, endTime: number) {
    const duration = endTime - startTime;
    this.metrics.performance.lastSyncDuration = duration;
    this.metrics.performance.syncStartTime = startTime;
    
    // Calculate rolling average
    if (this.metrics.performance.averageLatency === 0) {
      this.metrics.performance.averageLatency = duration;
    } else {
      this.metrics.performance.averageLatency = 
        (this.metrics.performance.averageLatency + duration) / 2;
    }
    
    this.notifyListeners();
  }

  // Error tracking
  recordError(type: 'api' | 'conversion' | 'validation' | 'database', error: string) {
    switch (type) {
      case 'api':
        this.metrics.errors.apiErrors++;
        break;
      case 'conversion':
        this.metrics.errors.conversionErrors++;
        break;
      case 'validation':
        this.metrics.errors.validationErrors++;
        break;
      case 'database':
        this.metrics.errors.databaseErrors++;
        break;
    }
    
    this.addRecentError(`${type.toUpperCase()}: ${error}`);
    this.checkForAlerts();
    this.notifyListeners();
  }

  private categorizeDataFreshness(timestamp: string): 'live' | 'recent' | 'stale' | 'offline' {
    if (!timestamp) return 'offline';
    
    try {
      const updateTime = new Date(timestamp);
      const now = new Date();
      const minutesDiff = (now.getTime() - updateTime.getTime()) / (1000 * 60);
      
      if (minutesDiff < 1) return 'live';
      if (minutesDiff < 5) return 'recent';
      if (minutesDiff < 30) return 'stale';
      return 'offline';
    } catch {
      return 'offline';
    }
  }

  private addRecentError(error: string) {
    this.metrics.errors.recentErrors.unshift(error);
    // Keep only last 10 errors
    this.metrics.errors.recentErrors = this.metrics.errors.recentErrors.slice(0, 10);
  }

  private checkForAlerts() {
    const totalOps = this.metrics.databaseOps.totalAttempts;
    const successRate = totalOps > 0 ? this.metrics.databaseOps.successful / totalOps : 1;
    
    if (successRate < this.alertThresholds.minSuccessRate && totalOps > 10) {
      console.warn(`🚨 Low success rate detected: ${(successRate * 100).toFixed(1)}%`);
    }
    
    if (this.metrics.errors.recentErrors.length >= this.alertThresholds.maxErrorCount) {
      console.warn(`🚨 High error count detected: ${this.metrics.errors.recentErrors.length} recent errors`);
    }
    
    const stalePercentage = this.metrics.positionValidation.totalPositions > 0 
      ? (this.metrics.positionValidation.stalePositions / this.metrics.positionValidation.totalPositions) * 100
      : 0;
      
    if (stalePercentage > 50) {
      console.warn(`🚨 High stale data percentage: ${stalePercentage.toFixed(1)}%`);
    }
  }

  // Public getters
  getMetrics(): DetailedSyncMetrics {
    return { ...this.metrics };
  }

  getSuccessRate(): number {
    const total = this.metrics.databaseOps.totalAttempts;
    return total > 0 ? this.metrics.databaseOps.successful / total : 1;
  }

  getDataQualityScore(): number {
    const total = this.metrics.positionValidation.totalPositions;
    const valid = this.metrics.positionValidation.validPositions;
    return total > 0 ? (valid / total) * 100 : 100;
  }

  // Subscription management
  subscribe(callback: (metrics: DetailedSyncMetrics) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Error notifying metrics listener:', error);
      }
    });
  }

  // Reset metrics
  reset() {
    this.metrics = createEmptyMetrics();
    this.notifyListeners();
  }
}

export const liveDataMonitor = LiveDataMonitor.getInstance();
