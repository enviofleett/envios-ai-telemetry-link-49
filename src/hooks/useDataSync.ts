
import { useState, useEffect } from 'react';
import { gp51DataSyncManager, SyncOperation, DataIntegrityReport } from '@/services/gp51/GP51DataSyncManager';

export interface UseDataSyncReturn {
  syncOperations: SyncOperation[];
  activeSyncOperation: SyncOperation | null;
  isLoading: boolean;
  startFullSync: () => Promise<string>;
  pauseSync: (operationId: string) => Promise<void>;
  resumeSync: (operationId: string) => Promise<void>;
  cancelSync: (operationId: string) => Promise<void>;
  generateIntegrityReport: () => Promise<DataIntegrityReport>;
  resolveConflict: (conflictId: string, resolution: 'prefer_local' | 'prefer_remote' | 'merge') => Promise<void>;
}

export const useDataSync = (): UseDataSyncReturn => {
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load existing operations
    setSyncOperations(gp51DataSyncManager.getAllSyncOperations());

    // Subscribe to sync updates
    const unsubscribe = gp51DataSyncManager.subscribe((operation) => {
      setSyncOperations(prev => {
        const index = prev.findIndex(op => op.id === operation.id);
        if (index >= 0) {
          const newOperations = [...prev];
          newOperations[index] = operation;
          return newOperations;
        } else {
          return [...prev, operation];
        }
      });
    });

    return unsubscribe;
  }, []);

  const activeSyncOperation = syncOperations.find(op => 
    op.status === 'running' || op.status === 'pending'
  ) || null;

  const startFullSync = async (): Promise<string> => {
    setIsLoading(true);
    try {
      const operationId = await gp51DataSyncManager.startFullSync();
      return operationId;
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSync = async (operationId: string): Promise<void> => {
    await gp51DataSyncManager.pauseSync(operationId);
  };

  const resumeSync = async (operationId: string): Promise<void> => {
    await gp51DataSyncManager.resumeSync(operationId);
  };

  const cancelSync = async (operationId: string): Promise<void> => {
    await gp51DataSyncManager.cancelSync(operationId);
  };

  const generateIntegrityReport = async (): Promise<DataIntegrityReport> => {
    return await gp51DataSyncManager.generateIntegrityReport();
  };

  const resolveConflict = async (conflictId: string, resolution: 'prefer_local' | 'prefer_remote' | 'merge'): Promise<void> => {
    await gp51DataSyncManager.resolveConflict(conflictId, resolution);
  };

  return {
    syncOperations,
    activeSyncOperation,
    isLoading,
    startFullSync,
    pauseSync,
    resumeSync,
    cancelSync,
    generateIntegrityReport,
    resolveConflict
  };
};
