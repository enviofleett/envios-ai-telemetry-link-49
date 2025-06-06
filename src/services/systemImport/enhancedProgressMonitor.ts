
import { supabase } from '@/integrations/supabase/client';
import { SystemImportProgress, SystemImportResult } from '@/types/system-import';

export class EnhancedProgressMonitor {
  async startMonitoring(
    importId: string, 
    onProgress: (progress: SystemImportProgress) => void
  ): Promise<SystemImportResult> {
    console.log('Starting enhanced progress monitoring for import:', importId);
    
    return new Promise((resolve, reject) => {
      const checkProgress = async () => {
        try {
          const { data: importJob, error } = await supabase
            .from('gp51_system_imports')
            .select('*')
            .eq('id', importId)
            .single();

          if (error) {
            console.error('Failed to fetch import job:', error);
            reject(new Error(`Failed to fetch import job: ${error.message}`));
            return;
          }

          if (!importJob) {
            reject(new Error('Import job not found'));
            return;
          }

          // Update progress
          onProgress({
            phase: importJob.current_phase || 'Unknown',
            phaseProgress: 100,
            overallProgress: importJob.progress_percentage || 0,
            currentOperation: importJob.phase_details || 'Processing...'
          });

          // Check if completed
          if (importJob.status === 'completed') {
            console.log('Import completed successfully');
            
            // Safely handle backup_tables JSON type
            let backupTables: string[] = [];
            if (importJob.backup_tables && typeof importJob.backup_tables === 'object') {
              const backupData = importJob.backup_tables as any;
              if (backupData.backup_tables && Array.isArray(backupData.backup_tables)) {
                backupTables = backupData.backup_tables.filter((item: any) => typeof item === 'string');
              }
            }
            
            resolve({
              importId,
              success: true,
              totalUsers: importJob.total_users || 0,
              successfulUsers: importJob.successful_users || 0,
              totalVehicles: importJob.total_devices || 0,
              successfulVehicles: importJob.successful_devices || 0,
              conflicts: (importJob.failed_users || 0) + (importJob.failed_devices || 0),
              backupTables
            });
            return;
          }

          // Check if failed
          if (importJob.status === 'failed') {
            // Safely handle error_log JSON type
            let errorMessage = 'Import failed for unknown reason';
            if (importJob.error_log && typeof importJob.error_log === 'object') {
              const errorData = importJob.error_log as any;
              if (errorData.error && typeof errorData.error === 'string') {
                errorMessage = errorData.error;
              }
            }
            
            console.error('Import failed:', errorMessage);
            reject(new Error(errorMessage));
            return;
          }

          // Continue monitoring if still processing
          if (importJob.status === 'processing') {
            setTimeout(checkProgress, 2000); // Check every 2 seconds
          }

        } catch (error) {
          console.error('Error monitoring import progress:', error);
          reject(error);
        }
      };

      // Start monitoring
      checkProgress();
    });
  }
}

export const enhancedProgressMonitor = new EnhancedProgressMonitor();
