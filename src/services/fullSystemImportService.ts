
import { supabase } from '@/integrations/supabase/client';
import { SystemImportOptions, SystemImportProgress, SystemImportResult } from '@/types/system-import';
import { importErrorHandler } from './systemImport/errorHandler';
import { transactionManager } from './systemImport/transactionManager';
import { gp51SessionManager } from './systemImport/gp51SessionManager';
import { enhancedProgressMonitor } from './systemImport/enhancedProgressMonitor';
import { gp51ConfigValidator } from './systemImport/gp51ConfigValidator';
import { importManagementService } from './systemImport/importManagementService';

class FullSystemImportService {
  async startFullSystemImport(
    options: SystemImportOptions,
    onProgress?: (progress: SystemImportProgress) => void
  ): Promise<SystemImportResult> {
    console.log('Starting enhanced full system import with options:', options);
    
    // Clear any previous errors
    importErrorHandler.clearErrors();
    
    try {
      // Phase 1: Enhanced Pre-flight validation
      onProgress?.({
        phase: 'Validation',
        phaseProgress: 0,
        overallProgress: 0,
        currentOperation: 'Running comprehensive pre-flight checks'
      });

      await this.runPreflightChecks(options);

      onProgress?.({
        phase: 'Validation',
        phaseProgress: 100,
        overallProgress: 5,
        currentOperation: 'Pre-flight validation completed successfully'
      });

      // Phase 2: Start transaction-safe import
      onProgress?.({
        phase: 'Initialization',
        phaseProgress: 0,
        overallProgress: 10,
        currentOperation: 'Initializing secure import transaction'
      });

      const importId = await this.initializeSecureImport(options);

      onProgress?.({
        phase: 'Initialization',
        phaseProgress: 100,
        overallProgress: 15,
        currentOperation: 'Import transaction initialized successfully'
      });

      // Phase 3: Execute import with enhanced monitoring
      console.log('Starting enhanced import execution with ID:', importId);
      
      return await enhancedProgressMonitor.startMonitoring(importId, onProgress);

    } catch (error) {
      console.error('Enhanced full system import failed:', error);
      
      // Log the error
      importErrorHandler.logError(
        'FULL_IMPORT_FAILED',
        `Full system import failed: ${error.message}`,
        { options, error },
        false
      );

      // Attempt rollback if we have an active transaction
      try {
        await transactionManager.rollbackTransaction('Import failed during execution');
      } catch (rollbackError) {
        console.error('Additional error during rollback:', rollbackError);
      }

      throw error;
    }
  }

  private async runPreflightChecks(options: SystemImportOptions): Promise<void> {
    console.log('Running enhanced pre-flight validation...');
    
    // 1. GP51 Configuration Validation
    const isGP51Valid = await gp51ConfigValidator.validateConfiguration();
    if (!isGP51Valid) {
      throw new Error('GP51 configuration validation failed. Please check your GP51 settings.');
    }

    // 2. GP51 Session Validation
    try {
      await gp51SessionManager.ensureValidSession();
      console.log('GP51 session validation passed');
    } catch (error) {
      importErrorHandler.logError(
        'GP51_SESSION_INVALID',
        'GP51 session validation failed',
        { error },
        false
      );
      throw new Error('GP51 session is invalid. Please re-authenticate with GP51.');
    }

    // 3. Database Connection Validation
    try {
      const { error } = await supabase.from('gp51_system_imports').select('id').limit(1);
      if (error) throw error;
      console.log('Database connection validation passed');
    } catch (error) {
      throw new Error('Database connection validation failed');
    }

    // 4. Options Validation
    this.validateImportOptions(options);
    
    console.log('All pre-flight checks passed successfully');
  }

  private validateImportOptions(options: SystemImportOptions): void {
    if (!options.importType) {
      throw new Error('Import type is required');
    }

    const validTypes = ['users_only', 'vehicles_only', 'complete_system', 'selective'];
    if (!validTypes.includes(options.importType)) {
      throw new Error(`Invalid import type: ${options.importType}`);
    }

    if (options.importType === 'selective' && (!options.selectedUsernames || options.selectedUsernames.length === 0)) {
      throw new Error('Selected usernames are required for selective import');
    }

    if (options.batchSize && (options.batchSize < 1 || options.batchSize > 100)) {
      throw new Error('Batch size must be between 1 and 100');
    }
  }

  private async initializeSecureImport(options: SystemImportOptions): Promise<string> {
    console.log('Initializing secure import with transaction management...');
    
    try {
      // Create the system import job record
      const { data: importJob, error: jobError } = await supabase
        .from('gp51_system_imports')
        .insert({
          job_name: `Enhanced System Import - ${new Date().toISOString()}`,
          import_type: 'full_system',
          import_scope: options.importType,
          status: 'processing',
          current_phase: 'initialization',
          pre_import_checks: {
            cleanup_requested: options.performCleanup,
            preserve_admin: options.preserveAdminEmail,
            batch_size: options.batchSize,
            validation_timestamp: new Date().toISOString()
          },
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (jobError) {
        console.error('Failed to create import job:', jobError);
        throw jobError;
      }

      const importId = importJob.id;
      
      // Start transaction management
      await transactionManager.startTransaction(importId);
      
      // Invoke the enhanced full-system-import edge function
      console.log('Invoking enhanced full-system-import edge function...');
      const { data, error } = await supabase.functions.invoke('full-system-import', {
        body: {
          jobName: importJob.job_name,
          importType: options.importType,
          selectedUsernames: options.selectedUsernames,
          performCleanup: options.performCleanup,
          preserveAdminEmail: options.preserveAdminEmail || 'chudesyl@gmail.com',
          batchSize: options.batchSize || 10,
          importId: importId // Pass the import ID for tracking
        }
      });

      if (error) {
        console.error('Import initialization error:', error);
        await transactionManager.rollbackTransaction('Edge function invocation failed');
        throw new Error(`Import initialization failed: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Import failed to start:', data);
        await transactionManager.rollbackTransaction('Import failed to start');
        throw new Error(data?.details || 'Import failed to start');
      }

      console.log('Secure import initialized successfully with ID:', importId);
      return importId;

    } catch (error) {
      importErrorHandler.logError(
        'IMPORT_INITIALIZATION_FAILED',
        `Failed to initialize secure import: ${error.message}`,
        { options, error },
        false
      );
      throw error;
    }
  }

  async getImportProgress(importId: string): Promise<SystemImportProgress[]> {
    try {
      const { data, error } = await supabase
        .from('gp51_import_progress_phases')
        .select('*')
        .eq('system_import_id', importId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      return data.map(phase => {
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
          overallProgress: 0,
          currentOperation,
          details: typeof phaseDetails === 'object' ? JSON.stringify(phaseDetails) : String(phaseDetails || '')
        };
      });
    } catch (error) {
      importErrorHandler.logError(
        'PROGRESS_FETCH_FAILED',
        `Failed to fetch import progress: ${error.message}`,
        { importId, error },
        true
      );
      throw error;
    }
  }

  async rollbackImport(importId: string): Promise<void> {
    console.log('Starting enhanced rollback for import:', importId);
    
    try {
      // Use the enhanced transaction manager for rollback
      await transactionManager.rollbackTransaction('User requested rollback');
      
      // Also call the existing rollback service
      await importManagementService.rollbackImport(importId);
      
      console.log('Enhanced rollback completed successfully');
    } catch (error) {
      importErrorHandler.logError(
        'ROLLBACK_FAILED',
        `Enhanced rollback failed: ${error.message}`,
        { importId, error },
        false
      );
      throw error;
    }
  }

  async cancelImport(importId: string): Promise<void> {
    console.log('Cancelling enhanced import:', importId);
    
    try {
      // Cancel through transaction manager
      await transactionManager.rollbackTransaction('User cancelled import');
      
      // Update import status
      await importManagementService.cancelImport(importId);
      
      // Clear any ongoing sessions
      gp51SessionManager.clearSession();
      
      console.log('Enhanced import cancellation completed');
    } catch (error) {
      importErrorHandler.logError(
        'CANCEL_FAILED',
        `Enhanced import cancellation failed: ${error.message}`,
        { importId, error },
        true
      );
      throw error;
    }
  }

  getErrorSummary(): string {
    return importErrorHandler.formatErrorsForUser();
  }

  hasErrors(): boolean {
    return importErrorHandler.getErrors().length > 0;
  }

  hasCriticalErrors(): boolean {
    return importErrorHandler.hasCriticalErrors();
  }
}

export const fullSystemImportService = new FullSystemImportService();

// Re-export types for backward compatibility
export type { SystemImportOptions, SystemImportProgress, SystemImportResult } from '@/types/system-import';
