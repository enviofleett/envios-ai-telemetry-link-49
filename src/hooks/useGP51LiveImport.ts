
// Stub implementation for GP51 live import hook

export interface GP51LiveData {
  users: any[];
  vehicles: any[];
  devices: any[];
  statistics: {
    totalUsers: number;
    totalDevices: number;
    totalVehicles: number;
    activeDevices: number;
  };
  lastUpdate: string;
}

export interface GP51LiveImportConfig {
  batchSize: number;
  interval: number;
  autoStart: boolean;
  userTypes: string[];
  selectedUserIds: string[];
  selectedDeviceIds: string[];
  importUsers: boolean;
  importDevices: boolean;
}

export interface GP51LiveImportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: GP51LiveImportConfig;
  startTime: string;
  endTime?: string;
}

export interface GP51ConnectionStatus {
  connected: boolean;
  lastCheck: Date;
  error?: string;
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

export { GP51ConnectionStatus };
export default useGP51LiveImport;
