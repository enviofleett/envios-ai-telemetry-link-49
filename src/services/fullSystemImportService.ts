
import { supabase } from '@/integrations/supabase/client';
import { SystemImportOptions, SystemImportProgress, SystemImportResult } from '@/types/system-import';
import { gp51ConfigValidator } from './systemImport/gp51ConfigValidator';
import { importProgressMonitor } from './systemImport/importProgressMonitor';
import { importManagementService } from './systemImport/importManagementService';

class FullSystemImportService {
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

      const isGP51Valid = await gp51ConfigValidator.validateConfiguration();
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
      return await importProgressMonitor.monitorProgress(importId, onProgress);

    } catch (error) {
      console.error('Full system import failed:', error);
      throw error;
    }
  }

  async getImportProgress(importId: string): Promise<SystemImportProgress[]> {
    return importProgressMonitor.getProgressPhases(importId);
  }

  async rollbackImport(importId: string): Promise<void> {
    return importManagementService.rollbackImport(importId);
  }

  async cancelImport(importId: string): Promise<void> {
    return importManagementService.cancelImport(importId);
  }
}

export const fullSystemImportService = new FullSystemImportService();

// Re-export types for backward compatibility
export type { SystemImportOptions, SystemImportProgress, SystemImportResult } from '@/types/system-import';
