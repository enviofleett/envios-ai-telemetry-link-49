
export interface ImportJob {
  id: string;
  job_name: string;
  status: string;
  import_type?: string;
  total_usernames: number;
  processed_usernames: number;
  successful_imports: number;
  failed_imports: number;
  total_vehicles_imported: number;
  admin_gp51_username?: string;
  imported_usernames?: any;
  progress_percentage?: number;
  current_step?: string;
  step_details?: string;
  error_log?: any;
  import_results?: any;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
