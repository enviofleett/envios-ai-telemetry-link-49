
import React from 'react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import DashboardLoadingSkeleton from './DashboardLoadingSkeleton';
import DashboardMetricsTransformer from './DashboardMetricsTransformer';
import DashboardContent from './DashboardContent';

const NewDashboard: React.FC = () => {
  const { 
    metrics, 
    isLoading
  } = useUnifiedVehicleData();

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <DashboardMetricsTransformer metrics={metrics}>
      {(summaryMetrics) => (
        <DashboardContent summaryMetrics={summaryMetrics} />
      )}
    </DashboardMetricsTransformer>
  );
};

export default NewDashboard;
