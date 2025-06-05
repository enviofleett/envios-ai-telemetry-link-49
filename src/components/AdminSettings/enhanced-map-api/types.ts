
export interface MapApiConfig {
  id: string;
  name: string;
  api_key: string;
  provider_type: string;
  threshold_type: string;
  threshold_value: number;
  is_active: boolean;
  fallback_priority: number;
  alert_threshold_80?: number;
  alert_threshold_90?: number;
  alert_threshold_95?: number;
  auto_fallback_enabled?: boolean;
  last_alert_sent?: string;
  performance_weight?: number;
  map_api_usage?: Array<{
    usage_date: string;
    request_count: number;
  }>;
}

export interface SystemOverviewData {
  activeConfigs: number;
  totalDailyUsage: number;
  avgUsagePercentage: number;
  autoFallbackEnabled: number;
}

export interface AlertLevel {
  level: 'critical' | 'high' | 'warning' | 'normal';
  color: string;
  threshold: number;
}
