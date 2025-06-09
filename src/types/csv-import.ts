
export interface CSVImportJob {
  id: string;
  job_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_name: string;
  total_rows: number;
  processed_rows: number;
  successful_imports: number;
  failed_imports: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  error_log: ValidationError[];
  import_results: Record<string, any>;
  progress_percentage: number;
}

export interface ValidationError {
  row_number: number;
  field_name?: string;
  error_message: string;
  raw_data?: Record<string, any>;
}

export interface CSVValidationLog {
  id: string;
  import_job_id: string;
  row_number: number;
  validation_type: string;
  field_name?: string;
  error_message: string;
  raw_data?: Record<string, any>;
  created_at: string;
}

export interface CSVImportTemplate {
  id: string;
  template_name: string;
  template_type: string;
  column_mappings: Record<string, ColumnMapping>;
  validation_rules: ValidationRules;
  is_system_template: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnMapping {
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'email';
  unique?: boolean;
  default?: any;
}

export interface ValidationRules {
  max_rows: number;
  allowed_formats: string[];
  required_columns: string[];
}

export interface CSVRowData {
  device_id: string;
  device_name: string;
  device_type?: string;
  sim_number?: string;
  status?: string;
  notes?: string;
  assigned_user_email?: string;
  is_active?: boolean;
}

export interface ImportPreviewData {
  valid_rows: CSVRowData[];
  invalid_rows: Array<{
    row_number: number;
    data: Record<string, any>;
    errors: ValidationError[];
  }>;
  conflicts: Array<{
    row_number: number;
    device_id: string;
    conflict_type: 'duplicate_device_id' | 'user_not_found';
    existing_data?: any;
  }>;
  summary: {
    total_rows: number;
    valid_rows: number;
    invalid_rows: number;
    conflicts: number;
  };
}
