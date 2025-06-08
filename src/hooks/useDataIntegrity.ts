
import { useState, useEffect } from 'react';
import { dataConsistencyVerifier, ConsistencyReport } from '@/services/dataIntegrity/DataConsistencyVerifier';
import { dataReconciliationService, ReconciliationJob } from '@/services/dataIntegrity/DataReconciliationService';
import { backupRollbackManager, BackupMetadata, BackupJob } from '@/services/dataIntegrity/BackupRollbackManager';

export interface DataIntegrityState {
  consistencyReport?: ConsistencyReport;
  reconciliationJobs: ReconciliationJob[];
  backups: BackupMetadata[];
  activeBackupJobs: BackupJob[];
  isLoading: boolean;
  error?: string;
  lastUpdated?: string;
}

export interface DataIntegrityActions {
  runConsistencyCheck: () => Promise<void>;
  startAutoReconciliation: () => Promise<void>;
  startManualReconciliation: (ruleIds: string[]) => Promise<void>;
  createBackup: (options?: any) => Promise<void>;
  rollbackToBackup: (backupId: string, options?: any) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useDataIntegrity = (autoStart: boolean = false) => {
  const [state, setState] = useState<DataIntegrityState>({
    reconciliationJobs: [],
    backups: [],
    activeBackupJobs: [],
    isLoading: false
  });

  const updateState = (updates: Partial<DataIntegrityState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString()
    }));
  };

  const setLoading = (loading: boolean) => {
    updateState({ isLoading: loading });
  };

  const setError = (error: string | undefined) => {
    updateState({ error });
  };

  // Actions
  const runConsistencyCheck = async () => {
    try {
      setLoading(true);
      setError(undefined);
      
      console.log('Running consistency check...');
      const report = await dataConsistencyVerifier.performFullConsistencyCheck();
      
      updateState({ consistencyReport: report });
      
    } catch (error) {
      console.error('Consistency check failed:', error);
      setError(error instanceof Error ? error.message : 'Consistency check failed');
    } finally {
      setLoading(false);
    }
  };

  const startAutoReconciliation = async () => {
    try {
      setLoading(true);
      setError(undefined);
      
      console.log('Starting automatic reconciliation...');
      const job = await dataReconciliationService.performAutomaticReconciliation();
      
      updateState({ 
        reconciliationJobs: [job, ...state.reconciliationJobs]
      });
      
    } catch (error) {
      console.error('Auto reconciliation failed:', error);
      setError(error instanceof Error ? error.message : 'Auto reconciliation failed');
    } finally {
      setLoading(false);
    }
  };

  const startManualReconciliation = async (ruleIds: string[]) => {
    try {
      setLoading(true);
      setError(undefined);
      
      console.log('Starting manual reconciliation for rules:', ruleIds);
      const job = await dataReconciliationService.performManualReconciliation(ruleIds);
      
      updateState({ 
        reconciliationJobs: [job, ...state.reconciliationJobs]
      });
      
    } catch (error) {
      console.error('Manual reconciliation failed:', error);
      setError(error instanceof Error ? error.message : 'Manual reconciliation failed');
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async (options: any = {}) => {
    try {
      setLoading(true);
      setError(undefined);
      
      console.log('Creating backup with options:', options);
      const job = await backupRollbackManager.createBackup(options);
      
      updateState({ 
        activeBackupJobs: [job, ...state.activeBackupJobs]
      });
      
      // Poll for job completion
      const pollInterval = setInterval(async () => {
        const updatedJob = backupRollbackManager.getJobStatus(job.id);
        if (updatedJob && (updatedJob.status === 'completed' || updatedJob.status === 'failed')) {
          clearInterval(pollInterval);
          
          updateState({ 
            activeBackupJobs: state.activeBackupJobs.filter(j => j.id !== job.id)
          });
          
          if (updatedJob.status === 'completed') {
            await refreshBackups();
          }
        }
      }, 2000);
      
    } catch (error) {
      console.error('Backup creation failed:', error);
      setError(error instanceof Error ? error.message : 'Backup creation failed');
    } finally {
      setLoading(false);
    }
  };

  const rollbackToBackup = async (backupId: string, options: any = {}) => {
    try {
      setLoading(true);
      setError(undefined);
      
      console.log('Rolling back to backup:', backupId);
      const result = await backupRollbackManager.rollbackToBackup({
        targetBackupId: backupId,
        createRollbackPoint: true,
        ...options
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Rollback failed');
      }
      
      console.log('Rollback completed successfully');
      
      // Refresh all data after rollback
      await refreshData();
      
    } catch (error) {
      console.error('Rollback failed:', error);
      setError(error instanceof Error ? error.message : 'Rollback failed');
    } finally {
      setLoading(false);
    }
  };

  const refreshBackups = async () => {
    try {
      const backups = await backupRollbackManager.listBackups();
      const activeJobs = backupRollbackManager.getActiveJobs();
      
      updateState({ 
        backups,
        activeBackupJobs: activeJobs
      });
      
    } catch (error) {
      console.error('Failed to refresh backups:', error);
    }
  };

  const refreshReconciliationJobs = async () => {
    try {
      const jobs = dataReconciliationService.getActiveJobs();
      updateState({ reconciliationJobs: jobs });
    } catch (error) {
      console.error('Failed to refresh reconciliation jobs:', error);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        refreshBackups(),
        refreshReconciliationJobs()
      ]);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    refreshData();
    
    if (autoStart) {
      // Start with a consistency check
      runConsistencyCheck();
    }
  }, [autoStart]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refreshReconciliationJobs();
      
      // Refresh active backup jobs
      const activeJobs = backupRollbackManager.getActiveJobs();
      updateState({ activeBackupJobs: activeJobs });
      
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Derived state
  const hasIntegrityIssues = state.consistencyReport && 
    (state.consistencyReport.checksFailed > 0 || state.consistencyReport.dataHealth === 'poor' || state.consistencyReport.dataHealth === 'critical');

  const integrityScore = state.consistencyReport?.overallScore || 0;

  const recentBackups = state.backups.filter(b => {
    const backupDate = new Date(b.createdAt);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return backupDate > sevenDaysAgo;
  });

  const dataHealth = state.consistencyReport?.dataHealth || 'unknown';

  const activeReconciliationJobs = state.reconciliationJobs.filter(j => 
    j.status === 'running' || j.status === 'pending'
  );

  const completedReconciliationJobs = state.reconciliationJobs.filter(j => 
    j.status === 'completed' || j.status === 'failed'
  );

  const actions: DataIntegrityActions = {
    runConsistencyCheck,
    startAutoReconciliation,
    startManualReconciliation,
    createBackup,
    rollbackToBackup,
    refreshData
  };

  return {
    // State
    ...state,
    
    // Derived state
    hasIntegrityIssues,
    integrityScore,
    recentBackups,
    dataHealth,
    activeReconciliationJobs,
    completedReconciliationJobs,
    
    // Actions
    ...actions
  };
};
