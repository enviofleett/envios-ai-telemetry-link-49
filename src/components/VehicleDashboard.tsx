
import React, { useState, useEffect } from 'react';
import { telemetryApi } from '@/services/telemetryApi';
import { useVehicleData } from '@/hooks/useVehicleData';
import DashboardHeader from './DashboardHeader';
import VehicleGrid from './VehicleGrid';
import LoadingSpinner from './LoadingSpinner';

const VehicleDashboard: React.FC = () => {
  const { vehicles, isLoading, fetchVehicles, fetchPositions } = useVehicleData();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPositions();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    telemetryApi.clearSession();
    window.location.reload();
  };

  // Fetch initial vehicles and positions
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch positions when vehicles are loaded
  useEffect(() => {
    if (vehicles.length > 0) {
      fetchPositions();
      
      // Set up periodic position updates every 30 seconds
      const positionInterval = setInterval(fetchPositions, 30000);
      
      return () => {
        clearInterval(positionInterval);
      };
    }
  }, [vehicles.length]);

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
