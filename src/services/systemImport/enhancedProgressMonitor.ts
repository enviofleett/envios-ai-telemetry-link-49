
import { supabase } from '@/integrations/supabase/client';
import { SystemImportProgress, SystemImportResult } from '@/types/system-import';
import { importErrorHandler } from './errorHandler';

export interface DetailedProgressPhase {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  details: string;
  subTasks?: Array<{
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
  }>;
}

export class EnhancedProgressMonitor {
  private phases: Map<string, DetailedProgressPhase> = new Map();
  private subscribers: Array<(progress: SystemImportProgress) => void> = [];
  private realTimeChannel: any = null;

  async startMonitoring(
    importId: string,
    onProgress?: (progress: SystemImportProgress) => void
  ): Promise<SystemImportResult> {
    console.log('Starting enhanced progress monitoring for:', importId);
    
    if (onProgress) {
      this.subscribers.push(onProgress);
    }

    // Set up real-time subscription
    this.setupRealTimeSubscription(importId);
    
    // Initialize progress phases
    this.initializePhases();
    
    return new Promise((resolve, reject) => {
      let timeoutHandle: NodeJS.Timeout | undefined;
      let pollInterval: NodeJS.Timeout | undefined;

      const cleanup = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (pollInterval) clearInterval(pollInterval);
        this.cleanupRealTime();
        this.subscribers = [];
      };

      // Polling fallback for robustness
      pollInterval = setInterval(async () => {
        try {
          const result = await this.checkImportStatus(importId);
          if (result) {
            cleanup();
            resolve(result);
          }
        } catch (error) {
          console.error('Progress monitoring error:', error);
          cleanup();
          reject(error);
        }
      }, 2000); // Poll every 2 seconds

      // Timeout after 45 minutes
      timeoutHandle = setTimeout(() => {
        cleanup();
        reject(new Error('Import timeout - operation took too long (45 minutes)'));
      }, 45 * 60 * 1000);
    });
  }

  private initializePhases(): void {
    const phases = [
      { name: 'validation', details: 'Validating GP51 configuration and prerequisites' },
      { name: 'backup', details: 'Creating system backup for rollback capability' },
      { name: 'cleanup', details: 'Cleaning existing data (if requested)' },
      { name: 'user_import', details: 'Importing GP51 users and authentication data' },
      { name: 'vehicle_import', details: 'Importing GP51 vehicles and device data' },
      { name: 'data_verification', details: 'Verifying imported data integrity' },
      { name: 'completion', details: 'Finalizing import and cleanup operations' }
    ];

    phases.forEach(phase => {
      this.phases.set(phase.name, {
        name: phase.name,
        status: 'pending',
        progress: 0,
        details: phase.details
      });
    });
  }

  private setupRealTimeSubscription(importId: string): void {
    this.realTimeChannel = supabase
      .channel(`enhanced-import-progress-${importId}`)
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
          this.handleImportUpdate(payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gp51_import_progress_phases',
          filter: `system_import_id=eq.${importId}`
        },
        (payload) => {
          console.log('Real-time phase update received:', payload);
          this.handlePhaseUpdate(payload.new);
        }
      )
      .subscribe();
  }

  private handleImportUpdate(importJob: any): void {
    const progress: SystemImportProgress = {
      phase: importJob.current_phase || 'Unknown',
      phaseProgress: 100,
      overallProgress: importJob.progress_percentage || 0,
      currentOperation: importJob.phase_details || 'Processing...',
      details: this.formatProgressDetails(importJob)
    };

    // Update phase status
    if (importJob.current_phase && this.phases.has(importJob.current_phase)) {
      const phase = this.phases.get(importJob.current_phase)!;
      phase.status = 'running';
      phase.progress = 100;
      phase.details = importJob.phase_details || phase.details;
    }

    // Notify all subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(progress);
      } catch (error) {
        console.error('Progress callback error:', error);
      }
    });
  }

  private handlePhaseUpdate(phaseData: any): void {
    if (phaseData.phase_name && this.phases.has(phaseData.phase_name)) {
      const phase = this.phases.get(phaseData.phase_name)!;
      
      phase.status = phaseData.phase_status || phase.status;
      phase.progress = phaseData.phase_progress || phase.progress;
      
      if (phaseData.started_at && !phase.startTime) {
        phase.startTime = new Date(phaseData.started_at);
      }
      
      if (phaseData.completed_at && !phase.endTime) {
        phase.endTime = new Date(phaseData.completed_at);
      }

      // Update details from phase_details JSON
      if (phaseData.phase_details && typeof phaseData.phase_details === 'object') {
        phase.details = phaseData.phase_details.details || phase.details;
      }
    }
  }

  private async checkImportStatus(importId: string): Promise<SystemImportResult | null> {
    try {
      const { data: importJob, error } = await supabase
        .from('gp51_system_imports')
        .select('*')
        .eq('id', importId)
        .single();

      if (error) {
        importErrorHandler.logError(
          'PROGRESS_CHECK_FAILED',
          `Failed to check import status: ${error.message}`,
          { importId, error },
          true
        );
        throw error;
      }

      if (!importJob) {
        throw new Error('Import job not found');
      }

      // Handle completion
      if (importJob.status === 'completed') {
        return this.buildSuccessResult(importJob);
      } else if (importJob.status === 'failed') {
        throw new Error(this.extractErrorMessage(importJob));
      }

      // Still in progress
      return null;
    } catch (error) {
      importErrorHandler.logError(
        'STATUS_CHECK_ERROR',
        `Error checking import status: ${error.message}`,
        { importId, error },
        true
      );
      throw error;
    }
  }

  private buildSuccessResult(importJob: any): SystemImportResult {
    // Safely handle backup_tables JSON
    let backupTables: string[] = [];
    if (importJob.backup_tables && typeof importJob.backup_tables === 'object') {
      if ('backup_tables' in importJob.backup_tables) {
        const tablesArray = (importJob.backup_tables as any).backup_tables;
        if (Array.isArray(tablesArray)) {
          backupTables = tablesArray;
        }
      }
    }

    return {
      importId: importJob.id,
      success: true,
      totalUsers: importJob.total_users || 0,
      successfulUsers: importJob.successful_users || 0,
      totalVehicles: importJob.total_devices || 0,
      successfulVehicles: importJob.successful_devices || 0,
      conflicts: 0,
      backupTables
    };
  }

  private extractErrorMessage(importJob: any): string {
    let errorMessage = 'Import failed';
    
    if (importJob.error_log && typeof importJob.error_log === 'object') {
      if ('error' in importJob.error_log) {
        errorMessage = (importJob.error_log as any).error || errorMessage;
      }
    }
    
    return errorMessage;
  }

  private formatProgressDetails(importJob: any): string {
    const details = [];
    
    if (importJob.processed_users !== undefined) {
      details.push(`Users: ${importJob.successful_users || 0}/${importJob.total_users || 0}`);
    }
    
    if (importJob.processed_devices !== undefined) {
      details.push(`Vehicles: ${importJob.successful_devices || 0}/${importJob.total_devices || 0}`);
    }
    
    if (importJob.data_integrity_score !== undefined) {
      details.push(`Integrity: ${Math.round(importJob.data_integrity_score)}%`);
    }
    
    return details.join(' | ');
  }

  private cleanupRealTime(): void {
    if (this.realTimeChannel) {
      supabase.removeChannel(this.realTimeChannel);
      this.realTimeChannel = null;
    }
  }

  getPhaseStatus(): DetailedProgressPhase[] {
    return Array.from(this.phases.values());
  }

  getCurrentPhase(): DetailedProgressPhase | null {
    for (const phase of this.phases.values()) {
      if (phase.status === 'running') {
        return phase;
      }
    }
    return null;
  }
}

export const enhancedProgressMonitor = new EnhancedProgressMonitor();
