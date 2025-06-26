
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
  
  // Vehicle movement metrics (missing properties)
  movingVehicles: number;
  stoppedVehicles: number;
  
  // Additional device metrics
  activeDevices?: number;
  inactiveDevices?: number;
  onlineDevices?: number;
  offlineDevices?: number;
  
  // Error handling
  error?: string;
}

export interface GP51HealthMetrics {
  isHealthy: boolean;
  lastCheck: string;
  consecutiveFailures: number;
  uptime: number;
}
