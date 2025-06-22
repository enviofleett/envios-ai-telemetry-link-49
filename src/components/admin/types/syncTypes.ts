
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

export interface SyncErrorDetails {
  error_type: string;
  error_message: string;
  timestamp: string;
  retry_count: number;
  resolution_status: string;
  suggested_actions: string[];
}

export interface SyncAnalyticsSummary {
  total_devices: number;
  successful_syncs: number;
  failed_syncs: number;
  success_rate: number;
  average_sync_duration: number;
  last_sync_time: string | null;
}

export interface PerformanceMetrics {
  cpu_usage: number;
  memory_usage: number;
  network_latency: number;
  batch_size: number;
  throughput: number;
  error_rate: number;
}

export interface MobileConfig {
  push_notifications: boolean;
  background_sync: boolean;
  data_compression: boolean;
  offline_mode: boolean;
  sync_frequency: number;
}
