
import React from 'react';
import SummaryCards from './SummaryCards';
import SystemHealthPanel from './SystemHealthPanel';
import RealTimeAlertsPanel from './RealTimeAlertsPanel';
import AnalyticsChartsRow from './AnalyticsChartsRow';

interface DashboardContentProps {
  summaryMetrics: {
    total: number;
    online: number;
    offline: number;
    alerts: number;
  };
}

const DashboardContent: React.FC<DashboardContentProps> = ({ summaryMetrics }) => {
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

export default DashboardContent;
