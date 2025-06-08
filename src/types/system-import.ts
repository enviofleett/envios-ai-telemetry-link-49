
export interface SystemImportOptions {
  importType: 'users_only' | 'vehicles_only' | 'complete_system' | 'selective';
  selectedUsernames?: string[];
  performCleanup?: boolean;
  preserveAdminEmail?: string;
  batchSize?: number;
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
  error?: string;
}
