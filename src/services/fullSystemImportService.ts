
import { supabase } from '@/integrations/supabase/client';
import { gp51SessionManager } from './systemImport/gp51SessionManager';
import { importErrorHandler } from './systemImport/errorHandler';

// Import types from the types file
import type { SystemImportOptions, ImportProgress, SystemImportResult } from '@/types/system-import';

// Re-export types for component use
export type { SystemImportOptions, ImportProgress, SystemImportResult };

class FullSystemImportService {
  private currentImportId: string | null = null;
  private progressCallback: ((progress: ImportProgress) => void) | null = null;
  private errors: string[] = [];
  private criticalErrors: string[] = [];

  async startFullSystemImport(
    options: SystemImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<SystemImportResult> {
    this.progressCallback = onProgress;
    this.errors = [];
    this.criticalErrors = [];
    
    console.log('🚀 Starting enhanced full system import with improved session management');
    
    try {
      // Phase 1: Pre-flight checks and session preparation
      await this.updateProgress('preparation', 5, 'Preparing import environment and validating GP51 session');
      
      // Prepare GP51 session for long-running operation
      const session = await gp51SessionManager.prepareForImport();
      console.log(`✅ GP51 session prepared for user: ${session.username}`);

      // Generate import ID
      this.currentImportId = crypto.randomUUID();
      
      // Phase 2: Create system backup
      await this.updateProgress('backup', 15, 'Creating comprehensive system backup');
      const backupResult = await this.createSystemBackup();
      
      // Phase 3: Optional cleanup
      let cleanupResult = null;
      if (options.performCleanup) {
        await this.updateProgress('cleanup', 25, 'Performing safe data cleanup');
        cleanupResult = await this.performSafeCleanup(options.preserveAdminEmail);
      }

      // Phase 4: Import execution
      await this.updateProgress('import', 40, 'Executing import operations');
      const importResult = await this.executeImport(options);

      // Phase 5: Finalization
      await this.updateProgress('completion', 95, 'Finalizing import and cleaning up');
      
      // Cleanup session management
      gp51SessionManager.cleanupAfterImport();
      
      await this.updateProgress('completed', 100, 'Import completed successfully');

      console.log('✅ Enhanced full system import completed successfully');
      
      return {
        success: true,
        importId: this.currentImportId,
        totalUsers: importResult.totalUsers || 0,
        successfulUsers: importResult.successfulUsers || 0,
        totalVehicles: importResult.totalVehicles || 0,
        successfulVehicles: importResult.successfulVehicles || 0,
        conflicts: importResult.conflicts || 0,
        backupTables: backupResult.backup_tables || []
      };

    } catch (error) {
      console.error('❌ Enhanced full system import failed:', error);
      
      // Cleanup session management on error
      gp51SessionManager.cleanupAfterImport();
      
      this.criticalErrors.push(error.message);
      
      await this.updateProgress('failed', -1, `Import failed: ${error.message}`);
      
      throw error;
    } finally {
      this.currentImportId = null;
      this.progressCallback = null;
    }
  }

  private async createSystemBackup(): Promise<any> {
    try {
      console.log('Creating comprehensive system backup...');
      
      const { data, error } = await supabase.rpc('create_system_backup_for_import', {
        import_id: this.currentImportId
      });

      if (error) {
        throw new Error(`Backup creation failed: ${error.message}`);
      }

      console.log('✅ System backup created successfully');
      return data;
      
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error(`Failed to create system backup: ${error.message}`);
    }
  }

  private async performSafeCleanup(preserveAdminEmail?: string): Promise<any> {
    try {
      console.log('Performing safe data cleanup...');
      
      const { data, error } = await supabase.rpc('perform_safe_data_cleanup', {
        preserve_admin_email: preserveAdminEmail || 'chudesyl@gmail.com'
      });

      if (error) {
        throw new Error(`Data cleanup failed: ${error.message}`);
      }

      console.log('✅ Safe data cleanup completed');
      return data;
      
    } catch (error) {
      console.error('Data cleanup failed:', error);
      throw new Error(`Failed to perform data cleanup: ${error.message}`);
    }
  }

  private async executeImport(options: SystemImportOptions): Promise<any> {
    try {
      console.log('Executing import operations with enhanced session management...');
      
      // Call the enhanced full system import function
      const { data, error } = await supabase.functions.invoke('full-system-import', {
        body: {
          importType: options.importType,
          selectedUsernames: options.selectedUsernames,
          performCleanup: false, // Already done in previous step
          preserveAdminEmail: options.preserveAdminEmail,
          batchSize: options.batchSize || 10,
          jobName: `Enhanced Import ${new Date().toISOString()}`,
          importId: this.currentImportId,
          stabilityFeatures: {
            memoryMonitoring: true,
            sessionRefresh: true,
            timeoutManagement: true,
            enhancedLogging: true
          }
        }
      });

      if (error) {
        throw new Error(`Import execution failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.details || 'Import execution failed');
      }

      console.log('✅ Import operations completed successfully');
      return data.results || {};
      
    } catch (error) {
      console.error('Import execution failed:', error);
      throw new Error(`Failed to execute import: ${error.message}`);
    }
  }

  private async updateProgress(phase: string, percentage: number, message: string, details?: any): Promise<void> {
    console.log(`📈 Import Progress [${percentage}%]: ${phase} - ${message}`);
    
    if (this.progressCallback) {
      this.progressCallback({
        phase,
        percentage,
        message,
        details,
        overallProgress: percentage,
        phaseProgress: 100,
        currentOperation: message
      });
    }

    // Small delay to ensure progress updates are visible
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async cancelImport(importId: string): Promise<void> {
    console.log(`🛑 Cancelling import: ${importId}`);
    
    try {
      // Update the import record to cancelled status
      const { error } = await supabase
        .from('gp51_system_imports')
        .update({
          status: 'cancelled',
          current_phase: 'cancelled',
          phase_details: 'Import cancelled by user'
        })
        .eq('id', importId);

      if (error) {
        throw new Error(`Failed to cancel import: ${error.message}`);
      }
      
      // Cleanup session management
      gp51SessionManager.cleanupAfterImport();
      
      // Reset state
      this.currentImportId = null;
      this.progressCallback = null;
      this.errors = [];
      this.criticalErrors = [];
      
      console.log('✅ Import cancelled and cleaned up');
      
    } catch (error) {
      console.error('Error during import cancellation:', error);
      throw error;
    }
  }

  async rollbackImport(importId: string): Promise<void> {
    console.log(`🔄 Rolling back import: ${importId}`);
    
    try {
      // For now, we'll mark the import as requiring manual rollback
      // since the RPC function doesn't exist yet
      const { error } = await supabase
        .from('gp51_system_imports')
        .update({
          status: 'rollback_requested',
          phase_details: 'Manual rollback requested - contact administrator'
        })
        .eq('id', importId);

      if (error) {
        throw new Error(`Rollback request failed: ${error.message}`);
      }

      console.log('✅ Import rollback requested - manual intervention required');
      
    } catch (error) {
      console.error('Error during import rollback:', error);
      throw error;
    }
  }

  getErrorSummary(): string {
    if (this.criticalErrors.length > 0) {
      return `Critical errors: ${this.criticalErrors.join(', ')}`;
    }
    if (this.errors.length > 0) {
      return `Errors: ${this.errors.join(', ')}`;
    }
    return '';
  }

  hasCriticalErrors(): boolean {
    return this.criticalErrors.length > 0;
  }

  getCurrentImportId(): string | null {
    return this.currentImportId;
  }
}

export const fullSystemImportService = new FullSystemImportService();
