
export interface GP51PerformanceMetrics {
  responseTime: number;
  success: boolean;
  requestStartTime: string;
  errorType?: string;
  deviceCount: number;
  groupCount: number;
  timestamp: string;
  apiCallCount: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface GP51HealthMetrics {
  isHealthy: boolean;
  lastCheck: string;
  consecutiveFailures: number;
  uptime: number;
}
