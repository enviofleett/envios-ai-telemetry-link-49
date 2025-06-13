
import React from 'react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import DashboardLoadingSkeleton from './DashboardLoadingSkeleton';
import DashboardContent from './DashboardContent';

const NewDashboard: React.FC = () => {
  const { 
    isLoading
  } = useUnifiedVehicleData();

  if (isLoading) {
    return <DashboardLoadingSkeleton />;
  }

  return <DashboardContent />;
};

export default NewDashboard;
