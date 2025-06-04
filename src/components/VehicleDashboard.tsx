
import React, { useState, useEffect } from 'react';
import { telemetryApi } from '@/services/telemetryApi';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';
import DashboardHeader from './DashboardHeader';
import VehicleGrid from './VehicleGrid';
import LoadingSpinner from './LoadingSpinner';

const VehicleDashboard: React.FC = () => {
  const { vehicles, isLoading, refetch } = useEnhancedVehicleData();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    telemetryApi.clearSession();
    window.location.reload();
  };

  // Update timestamp every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <DashboardHeader
        lastUpdate={lastUpdate}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onLogout={handleLogout}
      />
      <VehicleGrid vehicles={vehicles} />
    </div>
  );
};

export default VehicleDashboard;
