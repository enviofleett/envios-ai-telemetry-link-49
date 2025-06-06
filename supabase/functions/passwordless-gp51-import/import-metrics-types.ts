
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
  apiCallCount: number;
  retryCount: number;
  rollbackCount: number;
}

export interface ProcessingPhase {
  name: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string;
  progress: number;
}
