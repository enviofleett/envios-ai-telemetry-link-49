
import { Json } from '@/integrations/supabase/types';

export interface ExtractionJob {
  id: string;
  job_name: string;
  status: string;
  total_accounts: number;
  processed_accounts: number;
  successful_accounts: number;
  failed_accounts: number;
  total_vehicles: number;
  created_at: string;
  completed_at?: string | null;
  extracted_data?: Json;
  error_log?: Json;
}
