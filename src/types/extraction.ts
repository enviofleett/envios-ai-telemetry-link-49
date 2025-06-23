
export interface ExtractionJob {
  id: string;
  job_name: string;
  status: string;
  total_accounts: number;
  processed_accounts: number;
  successful_accounts: number;
  failed_accounts: number;
  total_vehicles: number;
  extracted_data?: any;
  error_log?: any;
  created_at: string;
  completed_at?: string;
}
