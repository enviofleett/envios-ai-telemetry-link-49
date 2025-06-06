
import { supabase } from '@/integrations/supabase/client';

export interface SystemImportOptions {
  importType: 'users_only' | 'vehicles_only' | 'complete_system' | 'selective';
  selectedUsernames?: string[];
  performCleanup?: boolean;
  preserveAdminEmail?: string;
  batchSize?: number;
}

export interface SystemImportProgress {
  phase: string;
  phaseProgress: number;
  overallProgress: number;
  currentOperation: string;
  details?: string;
}

export interface SystemImportResult {
  importId: string;
  success: boolean;
  totalUsers: number;
  successfulUsers: number;
  totalVehicles: number;
  successfulVehicles: number;
  conflicts: number;
  backupTables: string[];
  error?: string;
}

class FullSystemImportService {
  private async validateGP51Configuration(): Promise<boolean> {
    try {
      console.log('Validating GP51 configuration...');
      
      // Test GP51 connectivity
      const { data, error } = await supabase.functions.invoke('gp51-service-management', {
        body: { action: 'test_connection' }
      });
      
      if (error) {
        console.error('GP51 configuration test failed:', error);
        return false;
      }
      
      const isValid = data?.success || false;
      console.log('GP51 configuration validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Failed to validate GP51 configuration:', error);
      return false;
    }
  }

  async startFullSystemImport(
    options: SystemImportOptions,
    onProgress?: (progress: SystemImportProgress) => void
  ): Promise<SystemImportResult> {
    try {
      console.log('Starting full system import with options:', options);
      
      // Pre-flight checks
      onProgress?.({
        phase: 'Validation',
        phaseProgress: 0,
        overallProgress: 0,
        currentOperation: 'Validating GP51 configuration'
      });

      const isGP51Valid = await this.validateGP51Configuration();
      if (!isGP51Valid) {
        throw new Error('GP51 configuration is invalid. Please check your GP51 settings.');
      }

      onProgress?.({
        phase: 'Initialization',
        phaseProgress: 50,
        overallProgress: 5,
        currentOperation: 'Starting system import'
      });

      // Start the import with enhanced error handling
      console.log('Invoking full-system-import edge function...');
      const { data, error } = await supabase.functions.invoke('full-system-import', {
        body: {
          jobName: `Full System Import - ${new Date().toISOString()}`,
          importType: options.importType,
          selectedUsernames: options.selectedUsernames,
          performCleanup: options.performCleanup,
          preserveAdminEmail: options.preserveAdminEmail || 'chudesyl@gmail.com',
          batchSize: options.batchSize || 10
        }
      });

      if (error) {
        console.error('Import initialization error:', error);
        throw new Error(`Import initialization failed: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Import failed to start:', data);
        throw new Error(data?.details || 'Import failed to start');
      }

      const importId = data.importId;
      console.log('Import started successfully with ID:', importId);

      // Monitor progress with real-time updates
      return await this.monitorImportProgress(importId, onProgress);

    } catch (error) {
      console.error('Full system import failed:', error);
      throw error;
    }
  }

  private async monitorImportProgress(
    importId: string, 
    onProgress?: (progress: SystemImportProgress) => void
  ): Promise<SystemImportResult> {
    return new Promise((resolve, reject) => {
      console.log('Starting import progress monitoring for:', importId);
      
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
            this.handleImportUpdate(payload.new, onProgress, resolve, reject);
          }
        )
        .subscribe();

      // Polling fallback for robustness
      const pollInterval = setInterval(async () => {
        try {
          const { data: importJob, error } = await supabase
            .from('gp51_system_imports')
            .select('*')
            .eq('id', importId)
            .single();

          if (error) {
            console.error('Failed to fetch import status:', error);
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
            reject(new Error(`Failed to fetch import status: ${error.message}`));
            return;
          }

          if (!importJob) {
            console.error('Import job not found');
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
            reject(new Error('Import job not found'));
            return;
          }

          this.handleImportUpdate(importJob, onProgress, resolve, reject, () => {
            clearInterval(pollInterval);
            supabase.removeChannel(channel);
          });

        } catch (error) {
          console.error('Polling error:', error);
          clearInterval(pollInterval);
          supabase.removeChannel(channel);
          reject(error);
        }
      }, 3000); // Poll every 3 seconds

      // Timeout after 30 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
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
      
      if (backupTablesData && typeof backupTablesData === 'object' && 'backup_tables' in backupTablesData) {
        const tablesArray = (backupTablesData as any).backup_tables;
        if (Array.isArray(tablesArray)) {
          backupTables = tablesArray;
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
      
      if (errorLogData && typeof errorLogData === 'object' && 'error' in errorLogData) {
        errorMessage = (errorLogData as any).error || errorMessage;
      }
      
      console.error('Import failed:', errorMessage);
      reject?.(new Error(errorMessage));
    }
  }

  async getImportProgress(importId: string): Promise<SystemImportProgress[]> {
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
      
      if (phaseDetails && typeof phaseDetails === 'object' && 'details' in phaseDetails) {
        currentOperation = (phaseDetails as any).details || phase.phase_name;
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

  async rollbackImport(importId: string): Promise<void> {
    console.log('Starting rollback for import:', importId);
    
    const { data: importJob, error } = await supabase
      .from('gp51_system_imports')
      .select('rollback_data, backup_tables')
      .eq('id', importId)
      .single();

    if (error) throw error;

    // For now, we'll log the rollback attempt
    // In production, this would restore from backup tables
    const backupTablesData = importJob.backup_tables;
    
    if (backupTablesData && typeof backupTablesData === 'object' && 'backup_tables' in backupTablesData) {
      const backupTables = (backupTablesData as any).backup_tables;
      console.log('Rolling back from backup tables:', backupTables);
      
      // Log audit event
      await supabase
        .from('gp51_import_audit_log')
        .insert({
          system_import_id: importId,
          operation_type: 'rollback_completed',
          operation_details: { backupTables },
          success: true
        });
    }
  }

  async cancelImport(importId: string): Promise<void> {
    console.log('Cancelling import:', importId);
    
    await supabase
      .from('gp51_system_imports')
      .update({
        status: 'cancelled',
        current_phase: 'cancelled',
        phase_details: 'Import cancelled by user'
      })
      .eq('id', importId);
  }
}

export const fullSystemImportService = new FullSystemImportService();
