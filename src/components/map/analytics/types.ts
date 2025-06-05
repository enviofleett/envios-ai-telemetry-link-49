
export interface AnalyticsData {
  totalEvents: number;
  uniqueSessions: number;
  avgLoadTime: number;
  popularActions: Array<{ action: string; count: number }>;
  performanceMetrics: Array<{ date: string; loadTime: number; renderTime: number }>;
  zoomDistribution: Array<{ zoom: string; count: number }>;
}

export interface DateRangeOption {
  value: string;
  label: string;
}
