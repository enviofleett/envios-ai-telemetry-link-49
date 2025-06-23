
// Types for enhanced CSV import functionality
export interface EnhancedImportPreviewData {
  summary: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    unique_users: number;
    unique_devices: number;
    conflicts: number;
  };
  valid_rows: Array<{
    user_name: string;
    user_email: string;
    gp51_username?: string;
    generated_username?: string;
    device_id: string;
    device_name: string;
    assignment_type: string;
    validation_flags?: string[];
  }>;
  invalid_rows: any[];
  conflicts: Array<{
    row_number: number;
    conflict_type: string;
    suggested_resolution?: string;
  }>;
  gp51_validation: {
    auto_generated_usernames: number;
    username_conflicts: number;
    device_type_issues: number;
  };
}

export interface EnhancedCSVRowData {
  user_name: string;
  user_email: string;
  user_phone?: string;
  gp51_username?: string;
  generated_username?: string;
  device_id: string;
  device_name: string;
  device_type?: string;
  sim_number?: string;
  assignment_type: string;
  notes?: string;
  validation_flags?: string[];
}

export interface GP51ValidationResult {
  isValid: boolean;
  generatedUsername?: string;
  validationFlags: string[];
  deviceTypeMapping?: string;
  conflicts: Array<{
    type: string;
    message: string;
    suggestion?: string;
  }>;
}

export type GP51SyncStatus = {
  id: string;
  import_job_id: string;
  entity_type: 'user' | 'vehicle';
  entity_id: string;
  gp51_id?: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  conflict_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export interface CSVImportRelationship {
  id: string;
  import_job_id: string;
  row_number: number;
  user_identifier: string;
  device_id: string;
  relationship_type: string;
  gp51_user_id?: string;
  gp51_device_id?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface EnhancedCSVImportJob {
  id: string;
  job_name: string;
  file_name: string;
  total_rows: number;
  processed_rows: number;
  successful_imports: number;
  failed_imports: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  gp51_sync_enabled: boolean;
  auto_username_generation: boolean;
  supports_user_import: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  import_results: {
    users: {
      created: number;
      updated: number;
      failed: number;
    };
    devices: {
      created: number;
      updated: number;
      failed: number;
    };
    relationships: {
      created: number;
      failed: number;
    };
  };
  error_log: any[];
}
