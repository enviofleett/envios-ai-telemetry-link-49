import { UserImportResult, PasswordlessImportJob, ImportMetrics, DataConsistencyReport, ValidationResult } from './types.ts';
import { ErrorRecoveryManager } from './error-recovery.ts';
import { MonitoringMetrics } from './monitoring-metrics.ts';
import { DataValidator } from './data-validator.ts';
import { EnhancedGP51RateLimiter } from './enhanced-rate-limiter.ts';
import { ParallelProcessor } from './parallel-processor.ts';

export interface EnhancedUserImportResult extends UserImportResult {
  processingTimeMs: number;
  retryCount: number;
  rollbackPerformed: boolean;
  metricsSnapshot?: Partial<ImportMetrics>;
  validationErrors?: string[];
  consistencyIssues?: string[];
}

export interface EnhancedPasswordlessImportJob extends PasswordlessImportJob {
  processing_config?: {
    maxConcurrency: number;
    batchSize: number;
    adaptiveRateLimiting: boolean;
    rollbackEnabled: boolean;
  };
  performance_metrics?: ImportMetrics;
  consistency_report?: DataConsistencyReport;
  validation_summary?: ValidationResult;
  alert_summary?: {
    warnings: number;
    errors: number;
    critical: number;
  };
}

export interface JobProcessingContext {
  jobId: string;
  adminToken: string;
  supabase: any;
  errorRecovery: ErrorRecoveryManager;
  monitoring: MonitoringMetrics;
  validator: DataValidator;
  rateLimiter: EnhancedGP51RateLimiter;
  parallelProcessor: ParallelProcessor;
}

export interface BatchProcessingResult {
  batchNumber: number;
  results: EnhancedUserImportResult[];
  batchMetrics: {
    startTime: number;
    endTime: number;
    successCount: number;
    failureCount: number;
    totalVehicles: number;
    avgProcessingTime: number;
  };
  errors: string[];
}

// Re-export original types
export * from './types.ts';
