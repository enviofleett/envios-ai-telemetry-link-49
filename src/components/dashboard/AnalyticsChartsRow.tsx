
import React from 'react';
import UserDistributionChart from './UserDistributionChart';
import SubscriptionBreakdownChart from './SubscriptionBreakdownChart';

const AnalyticsChartsRow: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Distribution Chart */}
      <UserDistributionChart />
      
      {/* Subscription Breakdown Chart */}
      <SubscriptionBreakdownChart />
    </div>
  );
};

export default AnalyticsChartsRow;
