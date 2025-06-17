
import React from 'react';
import EnhancedReportsHub from '@/components/tracking/EnhancedReportsHub';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';

const Reports: React.FC = () => {
  const { vehicles } = useUnifiedVehicleData();
  
  return <EnhancedReportsHub vehicles={vehicles} />;
};

export default Reports;
