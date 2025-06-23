
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
