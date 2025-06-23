
import { Json } from '@/integrations/supabase/types';

export interface ImportJob {
  id: string;
  job_name: string;
  status: string;
  total_usernames: number;
  processed_usernames: number;
  successful_imports: number;
  failed_imports: number;
  total_vehicles_imported: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  error_log?: Json | null;
  import_results?: Json | null;
  admin_gp51_username?: string | null;
  import_type?: string;
  imported_usernames?: Json | null;
  progress_percentage?: number;
  current_step?: string;
  step_details?: string;
}

export interface ParsedErrorLog {
  username: string;
  error: string;
  timestamp?: string;
  step?: string;
  attempts?: number;
}
