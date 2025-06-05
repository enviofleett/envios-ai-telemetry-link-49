
import React, { useState, useEffect } from 'react';
import { telemetryApi } from '@/services/telemetryApi';
import { vehiclePositionSyncService } from '@/services/vehiclePosition/vehiclePositionSyncService';
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
    try {
      // Use the new position sync service for more reliable updates
      await vehiclePositionSyncService.forceSync();
      await fetchVehicles();
    } catch (error) {
      console.error('Refresh failed:', error);
      // Fallback to original method
      await fetchPositions();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    // Stop position sync service
    vehiclePositionSyncService.stopPeriodicSync();
    telemetryApi.clearSession();
    window.location.reload();
  };

  // Fetch initial vehicles and start position sync
  useEffect(() => {
    fetchVehicles();
    
    // Initialize position sync service
    vehiclePositionSyncService.startPeriodicSync();
    
    return () => {
      // Cleanup on unmount
      vehiclePositionSyncService.stopPeriodicSync();
    };
  }, []);

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
