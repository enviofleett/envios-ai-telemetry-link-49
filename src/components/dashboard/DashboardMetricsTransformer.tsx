
import React from 'react';

interface MetricsData {
  total: number;
  online: number;
  alerts: number;
}

interface SummaryMetrics {
  total: number;
  online: number;
  offline: number;
  alerts: number;
}

interface DashboardMetricsTransformerProps {
  metrics: MetricsData;
  children: (summaryMetrics: SummaryMetrics) => React.ReactNode;
}

const DashboardMetricsTransformer: React.FC<DashboardMetricsTransformerProps> = ({ 
  metrics, 
  children 
}) => {
  const summaryMetrics: SummaryMetrics = {
    total: metrics.total,
    online: metrics.online,
    offline: metrics.total - metrics.online,
    alerts: metrics.alerts
  };

  return <>{children(summaryMetrics)}</>;
};

export default DashboardMetricsTransformer;
