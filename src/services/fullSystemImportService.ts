import { supabase } from '@/integrations/supabase/client';
import { SystemImportOptions, SystemImportProgress, SystemImportResult } from '@/types/system-import';
import { importErrorHandler } from './systemImport/errorHandler';
import { transactionManager } from './systemImport/transactionManager';
import { gp51SessionManager } from './systemImport/gp51SessionManager';
import { enhancedProgressMonitor } from './systemImport/enhancedProgressMonitor';
import { gp51ConfigValidator } from './systemImport/gp51ConfigValidator';
import { importManagementService } from './systemImport/importManagementService';
import { importMemoryMonitor } from './systemImport/memoryMonitor';
import { importLogger } from './systemImport/importLogger';
import { importTimeoutManager } from './systemImport/timeoutManager';
import { performanceMetricsService } from './systemImport/performanceMetricsService';
import { notificationService } from './systemImport/notificationService';

class FullSystemImportService {
  async startFullSystemImport(
    options: SystemImportOptions,
    onProgress?: (progress: SystemImportProgress) => void
  ): Promise<SystemImportResult> {
    console.log('Starting enhanced full system import:', options);
    
    // Clear any previous errors and initialize logging
    importErrorHandler.clearErrors();
    
    const importId = crypto.randomUUID();
    importLogger.startImportLogging(importId);
    importLogger.info('import', 'Starting enhanced full system import', options);
    
    // Start performance monitoring
    performanceMetricsService.startMonitoring(importId);
    
    // Notify import started
    await notificationService.notifyImportStarted(importId, options.importType);
    
    try {
      // Phase 1: Enhanced Pre-flight validation
      importLogger.setPhase('validation');
      performanceMetricsService.setPhase('validation');
      
      onProgress?.({
        phase: 'Validation',
        phaseProgress: 0,
        overallProgress: 0,
        currentOperation: 'Running comprehensive pre-flight checks'
      });

      await this.runPreflightChecks(options);
      importLogger.info('validation', 'Pre-flight checks completed successfully');
      performanceMetricsService.recordProcessedRecords(1);

      onProgress?.({
        phase: 'Validation',
        phaseProgress: 100,
        overallProgress: 5,
        currentOperation: 'Pre-flight validation completed successfully'
      });

      // Phase 2: Initialize import
      importLogger.setPhase('initialization');
      performanceMetricsService.setPhase('initialization');
      
      onProgress?.({
        phase: 'Initialization',
        phaseProgress: 0,
        overallProgress: 10,
        currentOperation: 'Initializing enhanced import system'
      });

      const finalImportId = await this.initializeEnhancedImport(options, importId);
      importLogger.info('initialization', 'Enhanced import initialized successfully', { importId: finalImportId });
      performanceMetricsService.recordProcessedRecords(1);

      onProgress?.({
        phase: 'Initialization',
        phaseProgress: 100,
        overallProgress: 15,
        currentOperation: 'Import system initialized successfully'
      });

      // Phase 3: Execute import with monitoring
      importLogger.setPhase('execution');
      performanceMetricsService.setPhase('execution');
      importLogger.info('execution', 'Starting enhanced import execution', { importId: finalImportId });
      
      const result = await enhancedProgressMonitor.startMonitoring(finalImportId, (progress) => {
        onProgress?.(progress);
        
        // Notify progress updates
        notificationService.notifyImportProgress(
          finalImportId, 
          progress.overallProgress, 
          progress.phase
        );
      });
      
      // Record final metrics
      performanceMetricsService.recordProcessedRecords(result.totalUsers + result.totalVehicles);
      
      // Stop performance monitoring
      performanceMetricsService.stopMonitoring();
      
      // Notify completion
      await notificationService.notifyImportCompleted(finalImportId, {
        totalUsers: result.totalUsers,
        totalVehicles: result.totalVehicles,
        duration: this.calculateDuration(importLogger.getLogSummary())
      });
      
      importLogger.info('completion', 'Enhanced import completed successfully', result);
      importLogger.stopImportLogging();
      
      return result;

    } catch (error) {
      // Record error in performance metrics
      performanceMetricsService.recordError();
      performanceMetricsService.stopMonitoring();
      
      // Notify failure
      await notificationService.notifyImportFailed(importId, error.message);
      
      importLogger.critical('import', `Enhanced full system import failed: ${error.message}`, { error, options });
      console.error('Enhanced full system import failed:', error);
      
      // Log the error
      importErrorHandler.logError(
        'ENHANCED_IMPORT_FAILED',
        `Enhanced full system import failed: ${error.message}`,
        { options, error },
        false
      );

      importLogger.stopImportLogging();
      throw error;
    }
  }

  private calculateDuration(logSummary: any): string {
    return '5 minutes'; // Placeholder implementation
  }

  private async runPreflightChecks(options: SystemImportOptions): Promise<void> {
    importLogger.info('validation', 'Running enhanced pre-flight validation...');
    
    // 1. GP51 Configuration Validation
    const isGP51Valid = await gp51ConfigValidator.validateConfiguration();
    if (!isGP51Valid) {
      throw new Error('GP51 configuration validation failed. Please check your GP51 settings.');
    }
    importLogger.info('validation', 'GP51 configuration validation passed');

    // 2. GP51 Session Validation
    try {
      await gp51SessionManager.ensureValidSession();
      importLogger.info('validation', 'GP51 session validation passed');
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
      importLogger.info('validation', 'Database connection validation passed');
    } catch (error) {
      throw new Error('Database connection validation failed');
    }

    // 4. Options Validation
    this.validateImportOptions(options);
    importLogger.info('validation', 'Import options validation passed');
    
    // 5. Memory and Performance Check
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      if (usagePercent > 70) {
        importLogger.warn('validation', `High memory usage before import: ${usagePercent.toFixed(1)}%`);
      } else {
        importLogger.info('validation', `Memory usage acceptable: ${usagePercent.toFixed(1)}%`);
      }
    }
    
    importLogger.info('validation', 'All enhanced pre-flight checks passed successfully');
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

  private async initializeEnhancedImport(options: SystemImportOptions, importId: string): Promise<string> {
    importLogger.info('initialization', 'Initializing enhanced import...');
    
    try {
      // Invoke the enhanced full-system-import edge function
      importLogger.info('initialization', 'Invoking enhanced full-system-import edge function...');
      const { data, error } = await supabase.functions.invoke('full-system-import', {
        body: {
          jobName: `Enhanced System Import - ${new Date().toISOString()}`,
          importType: options.importType,
          selectedUsernames: options.selectedUsernames,
          performCleanup: options.performCleanup,
          preserveAdminEmail: options.preserveAdminEmail || 'chudesyl@gmail.com',
          batchSize: options.batchSize || 10,
          importId: importId,
          stabilityFeatures: {
            memoryMonitoring: true,
            sessionRefresh: true,
            timeoutManagement: true,
            enhancedLogging: true
          }
        }
      });

      if (error) {
        console.error('Enhanced import initialization error:', error);
        throw new Error(`Enhanced import initialization failed: ${error.message}`);
      }

      if (!data?.success) {
        console.error('Enhanced import failed to start:', data);
        throw new Error(data?.details || 'Enhanced import failed to start');
      }

      importLogger.info('initialization', 'Enhanced import initialized successfully', { importId });
      return data.importId || importId;

    } catch (error) {
      importErrorHandler.logError(
        'ENHANCED_IMPORT_INITIALIZATION_FAILED',
        `Failed to initialize enhanced import: ${error.message}`,
        { options, error },
        false
      );
      throw error;
    }
  }

  private startStabilityMonitoring(importId: string): void {
    importLogger.info('monitoring', 'Starting comprehensive stability monitoring...');
    
    // Start memory monitoring
    importMemoryMonitor.startMonitoring();
    importMemoryMonitor.onAlert((alert) => {
      importLogger.warn('memory', `Memory alert: ${alert.message}`, alert);
      performanceMetricsService.recordNetworkLatency(100); // Placeholder
    });

    // Start GP51 session refresh for long operations
    gp51SessionManager.startLongRunningOperation();

    // Start timeout management
    importTimeoutManager.startImportTimeout(importId);
    importTimeoutManager.onTimeout((reason) => {
      importLogger.critical('timeout', `Import timeout: ${reason}`);
      this.handleImportTimeout(reason);
    });
    importTimeoutManager.onCancel((reason) => {
      importLogger.warn('cancellation', `Import cancelled: ${reason}`);
    });

    importLogger.info('monitoring', 'All stability monitoring systems active');
  }

  private stopStabilityMonitoring(): void {
    importLogger.info('monitoring', 'Stopping stability monitoring systems...');
    
    // Stop memory monitoring
    if (importMemoryMonitor.isMonitoringActive()) {
      const summary = importMemoryMonitor.getMemorySummary();
      importLogger.info('memory', 'Final memory summary', summary);
      importMemoryMonitor.cleanup();
    }

    // Stop GP51 session management
    gp51SessionManager.stopLongRunningOperation();

    // Stop timeout management
    importTimeoutManager.destroy();

    importLogger.info('monitoring', 'All stability monitoring systems stopped');
  }

  private async handleImportTimeout(reason: string): Promise<void> {
    importLogger.critical('timeout', 'Handling import timeout', { reason });
    
    try {
      // Cancel the import gracefully
      importTimeoutManager.cancel(`Timeout: ${reason}`);
      
      // Attempt transaction rollback
      await transactionManager.rollbackTransaction(reason);
      
      importLogger.info('timeout', 'Import timeout handled with rollback completed');
    } catch (error) {
      importLogger.critical('timeout', 'Error during timeout handling', { error });
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
    importLogger.info('rollback', 'Starting enhanced rollback', { importId });
    
    try {
      await transactionManager.rollbackTransaction('User requested rollback');
      await importManagementService.rollbackImport(importId);
      
      importLogger.info('rollback', 'Enhanced rollback completed successfully');
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
    importLogger.info('cancellation', 'Cancelling enhanced import', { importId });
    
    try {
      importTimeoutManager.cancel('User cancelled import');
      await transactionManager.rollbackTransaction('User cancelled import');
      await importManagementService.cancelImport(importId);
      gp51SessionManager.clearSession();
      
      importLogger.info('cancellation', 'Enhanced import cancellation completed');
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

  getImportLogs(importId?: string): any[] {
    return importLogger.getLogs(importId ? { importId } : undefined);
  }

  getLogSummary(): any {
    return importLogger.getLogSummary();
  }

  exportImportLogs(format: 'json' | 'csv' = 'json'): string {
    return importLogger.exportLogs(format);
  }

  async getPerformanceMetrics(importId: string) {
    return await performanceMetricsService.getMetricsForImport(importId);
  }

  async getHistoricalPerformance(days: number = 7) {
    return await performanceMetricsService.getHistoricalMetrics(days);
  }

  getCurrentPerformanceSnapshot() {
    return performanceMetricsService.getCurrentSnapshot();
  }
}

export const fullSystemImportService = new FullSystemImportService();

// Re-export types for backward compatibility
export type { SystemImportOptions, SystemImportProgress, SystemImportResult } from '@/types/system-import';
