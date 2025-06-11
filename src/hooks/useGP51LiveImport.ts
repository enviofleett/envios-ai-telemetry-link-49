
// Stub implementation for GP51 live import hook

export interface GP51LiveData {
  users: any[];
  vehicles: any[];
  lastUpdate: string;
}

export interface GP51LiveImportConfig {
  batchSize: number;
  interval: number;
  autoStart: boolean;
}

export interface GP51LiveImportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: GP51LiveImportConfig;
  startTime: string;
  endTime?: string;
}

export const useGP51LiveImport = () => {
  return {
    isConnected: false,
    isImporting: false,
    data: null as GP51LiveData | null,
    error: 'GP51 live import not available - service is being rebuilt',
    startImport: () => {
      console.log('GP51 live import not available');
    },
    stopImport: () => {
      console.log('GP51 live import not available');
    },
    retry: () => {
      console.log('GP51 live import not available');
    }
  };
};

export default useGP51LiveImport;
