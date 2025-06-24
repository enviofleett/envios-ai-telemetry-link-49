
export interface SystemImportJob {
  id: string;
  import_type: string;
  status: string;
  current_phase?: string;
  phase_details?: string;
  progress_percentage?: number;
  total_users?: number;
  successful_users?: number;
  total_devices?: number;
  successful_devices?: number;
  backup_tables?: any;
  rollback_data?: any;
  error_log?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface SystemImportOptions {
  importType: 'complete_system' | 'users_only' | 'vehicles_only' | 'selective';
  performCleanup?: boolean;
  preserveAdminEmail?: string;
  batchSize?: number;
  selectedUsernames?: string[];
}

export interface ImportProgress {
  phase: string;
  percentage: number;
  message: string;
  overallProgress?: number;
  phaseProgress?: number;
  currentOperation?: string;
  details?: string;
}

export interface GP51ImportPreview {
  summary: {
    vehicles: number;
    users: number;
    groups: number;
  };
  sampleData: {
    vehicles: Array<{
      deviceId: string;
      deviceName: string;
      status: string;
      lastActive?: string;
    }>;
    users: Array<{
      username: string;
      email?: string;
      userType: number;
    }>;
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
  conflictResolution: 'skip' | 'update' | 'replace';
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
