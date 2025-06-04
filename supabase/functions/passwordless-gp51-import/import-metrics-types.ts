
export interface ImportMetrics {
  jobId: string;
  startTime: number;
  endTime?: number;
  totalUsers: number;
  processedUsers: number;
  successfulUsers: number;
  failedUsers: number;
  totalVehicles: number;
  averageVehiclesPerUser: number;
  averageProcessingTimePerUser: number;
  errorRate: number;
  throughputUsersPerMinute: number;
  throughputVehiclesPerMinute: number;
  memoryUsage?: number;
  apiCallCount: number;
  retryCount: number;
  rollbackCount: number;
}
