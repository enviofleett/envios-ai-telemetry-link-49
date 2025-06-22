
import { Json } from '@/integrations/supabase/types';

export interface SyncStatus {
  id: string;
  sync_type: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  total_devices: number;
  successful_syncs: number;
  failed_syncs: number;
  error_log: Json;
  sync_details: Json;
  created_at: string;
}

export interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastSyncTime: string | null;
  averageDuration: number | null;
}
