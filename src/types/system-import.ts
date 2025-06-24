
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

// Unified SystemImportOptions interface that includes all properties used across components
export interface SystemImportOptions {
  importUsers: boolean;
  importDevices: boolean;
  conflictResolution: 'skip' | 'overwrite' | 'merge';
  usernames?: string[];
  batchSize?: number;
  // Additional properties needed by various components
  importType?: 'complete_system' | 'users_only' | 'vehicles_only' | 'selective';
  performCleanup?: boolean;
  preserveAdminEmail?: string;
  selectedUsernames?: string[];
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
  // Additional properties from database
  import_type?: string;
  current_phase?: string;
  progress_percentage?: number;
  successful_users?: number;
  total_users?: number;
  successful_devices?: number;
  total_devices?: number;
  created_at?: string;
}

export interface ImportProgress {
  phase: string;
  phaseProgress: number;
  overallProgress: number;
  currentOperation: string;
  details?: string;
  // Additional property used in some components
  percentage?: number;
}
