
export interface GP51ImportPreview {
  summary: {
    vehicles: number;
    users: number;
    groups: number;
  };
  sampleData: {
    vehicles: any[];
    users: any[];
  };
  conflicts: {
    existingUsers: string[];
    existingDevices: string[];
    potentialDuplicates: number;
  };
  authentication: {
    connected: boolean;
    username?: string;
    error?: string;
  };
  estimatedDuration: string;
  warnings: string[];
}

export interface GP51ImportOptions {
  importUsers: boolean;
  importDevices: boolean;
  conflictResolution: 'skip' | 'overwrite' | 'merge';
  usernames?: string[];
  batchSize?: number;
}

export interface GP51ImportResult {
  success: boolean;
  statistics: {
    usersProcessed: number;
    usersImported: number;
    devicesProcessed: number;
    devicesImported: number;
    conflicts: number;
  };
  message: string;
  errors: string[];
  duration: number;
}

export interface SystemImportProgress {
  phase: string;
  phaseProgress: number;
  overallProgress: number;
  currentOperation: string;
  details?: string;
}

export interface SystemImportResult {
  importId: string;
  success: boolean;
  totalUsers: number;
  successfulUsers: number;
  totalVehicles: number;
  successfulVehicles: number;
  conflicts: number;
  backupTables: string[];
}

// Add missing type exports
export interface SystemImportOptions {
  importUsers: boolean;
  importDevices: boolean;
  conflictResolution: 'skip' | 'overwrite' | 'merge';
  usernames?: string[];
  batchSize?: number;
}

export interface SystemImportJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentPhase: string;
  startedAt: string;
  completedAt?: string;
  results?: GP51ImportResult;
  errors: string[];
}

export interface ImportProgress {
  phase: string;
  phaseProgress: number;
  overallProgress: number;
  currentOperation: string;
  details?: string;
}
