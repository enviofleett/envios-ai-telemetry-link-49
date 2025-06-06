
import { ImportMetrics, ProcessingPhase } from './import-metrics-types.ts';
import { AlertManager } from './performance-alerts.ts';

export interface JobContext {
  jobId: string;
  jobName: string;
  targetUsernames: string[];
  metrics: ImportMetrics;
  phases: ProcessingPhase[];
  alertManager: AlertManager;
  startTime: number;
}

export async function initializeJobContext(jobName: string, targetUsernames: string[]): Promise<JobContext> {
  const jobId = crypto.randomUUID();
  const startTime = Date.now();
  
  const metrics: ImportMetrics = {
    jobId,
    startTime,
    totalUsers: targetUsernames.length,
    processedUsers: 0,
    successfulUsers: 0,
    failedUsers: 0,
    totalVehicles: 0,
    averageVehiclesPerUser: 0,
    averageProcessingTimePerUser: 0,
    errorRate: 0,
    throughputUsersPerMinute: 0,
    throughputVehiclesPerMinute: 0,
    apiCallCount: 0,
    retryCount: 0,
    rollbackCount: 0
  };

  const phases: ProcessingPhase[] = [
    {
      name: 'initialization',
      startTime,
      status: 'running',
      progress: 0
    },
    {
      name: 'user_processing',
      startTime: 0,
      status: 'pending',
      progress: 0
    },
    {
      name: 'vehicle_extraction',
      startTime: 0,
      status: 'pending',
      progress: 0
    },
    {
      name: 'completion',
      startTime: 0,
      status: 'pending',
      progress: 0
    }
  ];

  return {
    jobId,
    jobName,
    targetUsernames,
    metrics,
    phases,
    alertManager: new AlertManager(),
    startTime
  };
}
