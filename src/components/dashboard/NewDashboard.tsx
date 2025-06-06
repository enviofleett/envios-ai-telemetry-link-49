
import React from 'react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import SummaryCards from './SummaryCards';
import SystemHealthPanel from './SystemHealthPanel';
import RealTimeAlertsPanel from './RealTimeAlertsPanel';
import AnalyticsChartsRow from './AnalyticsChartsRow';

const NewDashboard: React.FC = () => {
  const { 
    vehicles, 
    metrics, 
    isLoading
  } = useUnifiedVehicleData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[120px] bg-gray-very-light rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-very-light rounded-lg"></div>
            <div className="h-96 bg-gray-very-light rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  const summaryMetrics = {
    total: metrics.total,
    online: metrics.online,
    offline: metrics.total - metrics.online,
    alerts: metrics.alerts
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards Row */}
      <SummaryCards metrics={summaryMetrics} />

      {/* System Health and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemHealthPanel />
        <RealTimeAlertsPanel />
      </div>

      {/* Analytics Charts Row */}
      <AnalyticsChartsRow />
    </div>
  );
};

export default NewDashboard;
