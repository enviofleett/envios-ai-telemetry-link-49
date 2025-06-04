
import { MonitoringMetrics } from './monitoring-metrics.ts';

export class JobStatusManager {
  constructor(private supabase: any) {}

  async updateJobStatus(
    jobId: string, 
    status: string, 
    currentStep: string, 
    stepDetails: string
  ): Promise<void> {
    await this.supabase
      .from('user_import_jobs')
      .update({
        status,
        current_step: currentStep,
        step_details: stepDetails,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  async updateJobProgress(
    jobId: string, 
    processed: number, 
    total: number, 
    monitoring: MonitoringMetrics
  ): Promise<void> {
    const progressPercentage = Math.round((processed / total) * 100);
    const metrics = monitoring.getMetrics();
    
    await this.supabase
      .from('user_import_jobs')
      .update({
        processed_usernames: processed,
        successful_imports: metrics.successfulUsers,
        failed_imports: metrics.failedUsers,
        total_vehicles_imported: metrics.totalVehicles,
        progress_percentage: progressPercentage,
        step_details: `Processed ${processed}/${total} users. Success rate: ${((metrics.successfulUsers / Math.max(1, processed)) * 100).toFixed(1)}%. Avg time: ${Math.round(metrics.averageProcessingTimePerUser)}ms/user`,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  async finalizeJob(
    jobId: string,
    successCount: number,
    failedCount: number,
    totalUsers: number,
    totalVehicles: number,
    healthScore: number,
    processingTime: number,
    errorLog: any[]
  ): Promise<void> {
    const finalStatus = failedCount === totalUsers ? 'failed' : 'completed';
    const processingTimeSeconds = Math.round(processingTime / 1000);
    
    await this.supabase
      .from('user_import_jobs')
      .update({
        status: finalStatus,
        current_step: finalStatus === 'completed' ? 'Enhanced import completed successfully' : 'Enhanced import completed with errors',
        step_details: `Final results: ${successCount}/${totalUsers} users successful, ${totalVehicles} vehicles imported. Health Score: ${healthScore}%. Total time: ${processingTimeSeconds}s`,
        progress_percentage: 100,
        error_log: errorLog,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}
