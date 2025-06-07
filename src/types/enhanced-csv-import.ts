
import { CSVImportJob, ValidationError } from './csv-import';

export interface GP51SyncStatus {
  id: string;
  import_job_id: string;
  entity_type: 'user' | 'vehicle';
  entity_id: string;
  gp51_id?: string;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  sync_attempts: number;
  last_sync_attempt?: string;
  sync_error?: string;
  conflict_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CSVImportRelationship {
  id: string;
  import_job_id: string;
  user_identifier: string;
  device_id: string;
  relationship_type: 'assigned' | 'owner' | 'operator';
  row_number: number;
  gp51_user_id?: string;
  gp51_device_id?: string;
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export interface EnhancedCSVRowData {
  // User data
  user_name: string;
  user_email: string;
  user_phone?: string;
  gp51_username?: string;
  
  // Vehicle data
  device_id: string;
  device_name: string;
  device_type?: string;
  sim_number?: string;
  
  // Relationship data
  assignment_type?: 'assigned' | 'owner' | 'operator';
  notes?: string;
  
  // Internal processing
  generated_username?: string;
  validation_flags?: string[];
}

export interface EnhancedImportPreviewData {
  valid_rows: EnhancedCSVRowData[];
  invalid_rows: Array<{
    row_number: number;
    data: Record<string, any>;
    errors: ValidationError[];
  }>;
  conflicts: Array<{
    row_number: number;
    conflict_type: 'duplicate_user' | 'duplicate_device' | 'invalid_gp51_data';
    existing_data?: any;
    suggested_resolution?: string;
  }>;
  gp51_validation: {
    username_conflicts: number;
    device_type_issues: number;
    auto_generated_usernames: number;
  };
  summary: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    conflicts: number;
    unique_users: number;
    unique_devices: number;
  };
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

export interface EnhancedCSVImportJob extends CSVImportJob {
  supports_user_import: boolean;
  gp51_sync_enabled: boolean;
  sync_summary?: {
    users_synced: number;
    vehicles_synced: number;
    sync_failures: number;
    pending_syncs: number;
  };
}
