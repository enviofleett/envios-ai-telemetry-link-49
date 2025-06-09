
import { useState, useCallback } from 'react';
import { GP51LiveImportConfig } from './gp51LiveImport/types';
import { createDefaultImportConfig, processLiveDataForConfig } from './gp51LiveImport/utils';
import { useGP51Connection } from './gp51LiveImport/useGP51Connection';
import { useGP51DataFetcher } from './gp51LiveImport/useGP51DataFetcher';
import { useGP51ImportManager } from './gp51LiveImport/useGP51ImportManager';

// Re-export types for backward compatibility
export type {
  GP51ConnectionStatus,
  GP51LiveData,
  GP51User,
  GP51Device,
  GP51Group,
  GP51LiveImportConfig,
  GP51LiveImportJob
} from './gp51LiveImport/types';

export const useGP51LiveImport = () => {
  const [importConfig, setImportConfig] = useState<GP51LiveImportConfig>(createDefaultImportConfig());

  // Use the refactored hooks
  const { connectionStatus, isLoading: connectionLoading, checkConnection } = useGP51Connection();
  const { liveData, isLoading: dataLoading, fetchLiveData, setLiveData } = useGP51DataFetcher(connectionStatus);
  const { importJob, isImporting, startImport, setImportJob, setIsImporting } = useGP51ImportManager();

  const isLoading = connectionLoading || dataLoading;

  const updateImportConfig = useCallback((config: Partial<GP51LiveImportConfig>) => {
    setImportConfig(prev => ({ ...prev, ...config }));
  }, []);

  const handleFetchLiveData = useCallback(async () => {
    const fetchedData = await fetchLiveData();
    if (fetchedData) {
      // Update config with fetched data
      const configUpdate = processLiveDataForConfig(fetchedData, importConfig);
      setImportConfig(prev => ({ ...prev, ...configUpdate }));
    }
  }, [fetchLiveData, importConfig]);

  const handleStartImport = useCallback(async () => {
    if (liveData) {
      await startImport(liveData, importConfig);
    }
  }, [liveData, importConfig, startImport]);

  const clearData = useCallback(() => {
    setLiveData(null);
    setImportJob(null);
    setImportConfig(createDefaultImportConfig());
    setIsImporting(false);
  }, [setLiveData, setImportJob, setIsImporting]);

  return {
    connectionStatus,
    liveData,
    importConfig,
    importJob,
    isLoading,
    isImporting,
    checkConnection,
    fetchLiveData: handleFetchLiveData,
    updateImportConfig,
    startImport: handleStartImport,
    clearData
  };
};
