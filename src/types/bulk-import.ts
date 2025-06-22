
export interface BulkImportJob {
  id: string;
  job_name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'completed_with_errors' | 'failed';
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  current_chunk: number;
  total_chunks: number;
  chunk_size: number;
  error_log: any; // Changed from any[] to any to match Supabase Json type
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  import_type: string;
  import_data?: any;
}

export interface ImportProgress {
  jobId: string;
  overallProgress: number;
  chunkProgress: number;
  currentChunk: number;
  totalChunks: number;
  successfulItems: number;
  failedItems: number;
  errors: any[];
}

export interface ImportStats {
  totalVehiclesInSystem: number;
  lastImportCount: number;
  successRate: number;
  averageImportTime: number;
}
