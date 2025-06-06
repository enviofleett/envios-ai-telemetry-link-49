
import { supabase } from '@/integrations/supabase/client';
import { SystemImportProgress, SystemImportResult } from '@/types/system-import';

export class ImportProgressMonitor {
  async monitorProgress(
    importId: string, 
    onProgress?: (progress: SystemImportProgress) => void
  ): Promise<SystemImportResult> {
    return new Promise((resolve, reject) => {
      console.log('Starting import progress monitoring for:', importId);
      
      let pollInterval: NodeJS.Timeout | undefined;
      let timeoutHandle: NodeJS.Timeout | undefined;
      
      const cleanup = () => {
        if (pollInterval) clearInterval(pollInterval);
        if (timeoutHandle) clearTimeout(timeoutHandle);
      };

      // Set up real-time subscription for live updates
      const channel = supabase
        .channel(`import-progress-${importId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'gp51_system_imports',
            filter: `id=eq.${importId}`
          },
          (payload) => {
            console.log('Real-time import update received:', payload);
            this.handleImportUpdate(payload.new, onProgress, resolve, reject, cleanup);
          }
        )
        .subscribe();

      // Polling fallback for robustness
      pollInterval = setInterval(async () => {
        try {
          const { data: importJob, error } = await supabase
            .from('gp51_system_imports')
            .select('*')
            .eq('id', importId)
            .single();

          if (error) {
            console.error('Failed to fetch import status:', error);
            cleanup();
            supabase.removeChannel(channel);
            reject(new Error(`Failed to fetch import status: ${error.message}`));
            return;
          }

          if (!importJob) {
            console.error('Import job not found');
            cleanup();
            supabase.removeChannel(channel);
            reject(new Error('Import job not found'));
            return;
          }

          this.handleImportUpdate(importJob, onProgress, resolve, reject, cleanup);

        } catch (error) {
          console.error('Polling error:', error);
          cleanup();
          supabase.removeChannel(channel);
          reject(error);
        }
      }, 3000); // Poll every 3 seconds

      // Timeout after 30 minutes
      timeoutHandle = setTimeout(() => {
        cleanup();
        supabase.removeChannel(channel);
        reject(new Error('Import timeout - operation took too long'));
      }, 30 * 60 * 1000);
    });
  }

  private handleImportUpdate(
    importJob: any,
    onProgress?: (progress: SystemImportProgress) => void,
    resolve?: (result: SystemImportResult) => void,
    reject?: (error: Error) => void,
    cleanup?: () => void
  ) {
    // Update progress
    onProgress?.({
      phase: importJob.current_phase || 'Unknown',
      phaseProgress: 100,
      overallProgress: importJob.progress_percentage || 0,
      currentOperation: importJob.phase_details || 'Processing...'
    });

    // Check if completed
    if (importJob.status === 'completed') {
      cleanup?.();
      
      // Safely handle backup_tables Json type
      const backupTablesData = importJob.backup_tables;
      let backupTables: string[] = [];
      
      if (backupTablesData && typeof backupTablesData === 'object') {
        if ('backup_tables' in backupTablesData) {
          const tablesArray = (backupTablesData as any).backup_tables;
          if (Array.isArray(tablesArray)) {
            backupTables = tablesArray;
          }
        }
      }
      
      console.log('Import completed successfully:', importJob);
      resolve?.({
        importId: importJob.id,
        success: true,
        totalUsers: importJob.total_users || 0,
        successfulUsers: importJob.successful_users || 0,
        totalVehicles: importJob.total_devices || 0,
        successfulVehicles: importJob.successful_devices || 0,
        conflicts: 0,
        backupTables
      });
    } else if (importJob.status === 'failed') {
      cleanup?.();
      
      // Safely handle error_log Json type
      const errorLogData = importJob.error_log;
      let errorMessage = 'Import failed';
      
      if (errorLogData && typeof errorLogData === 'object') {
        if ('error' in errorLogData) {
          errorMessage = (errorLogData as any).error || errorMessage;
        }
      }
      
      console.error('Import failed:', errorMessage);
      reject?.(new Error(errorMessage));
    }
  }

  async getProgressPhases(importId: string): Promise<SystemImportProgress[]> {
    const { data, error } = await supabase
      .from('gp51_import_progress_phases')
      .select('*')
      .eq('system_import_id', importId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    return data.map(phase => {
      // Safely handle phase_details Json type
      let currentOperation = phase.phase_name;
      const phaseDetails = phase.phase_details;
      
      if (phaseDetails && typeof phaseDetails === 'object') {
        if ('details' in phaseDetails) {
          currentOperation = (phaseDetails as any).details || phase.phase_name;
        }
      }
      
      return {
        phase: phase.phase_name,
        phaseProgress: phase.phase_progress,
        overallProgress: 0, // Calculate based on all phases
        currentOperation,
        details: typeof phaseDetails === 'object' ? JSON.stringify(phaseDetails) : String(phaseDetails || '')
      };
    });
  }
}

export const importProgressMonitor = new ImportProgressMonitor();
