
import React, { useState, useEffect } from 'react';
import { telemetryApi } from '@/services/telemetryApi';
import { vehiclePositionSyncService } from '@/services/vehiclePosition/vehiclePositionSyncService';
import { useVehicleData } from '@/hooks/useVehicleData';
import DashboardHeader from './DashboardHeader';
import VehicleGrid from './VehicleGrid';
import LoadingFallback from './LoadingFallback';

const VehicleDashboard: React.FC = () => {
  const { vehicles, isLoading, fetchVehicles, fetchPositions } = useVehicleData();
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      await vehiclePositionSyncService.forceSync();
      await fetchVehicles();
    } catch (error) {
      console.error('Refresh failed:', error);
      setError('Failed to refresh vehicle data');
      
      try {
        await fetchPositions();
      } catch (fallbackError) {
        console.error('Fallback refresh also failed:', fallbackError);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    try {
      vehiclePositionSyncService.stopPeriodicSync();
      telemetryApi.clearSession();
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.reload();
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await fetchVehicles();
        vehiclePositionSyncService.startPeriodicSync();
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        setError('Failed to load dashboard data');
      }
    };

    initializeDashboard();
    
    return () => {
      try {
        vehiclePositionSyncService.stopPeriodicSync();
      } catch (error) {
        console.error('Error stopping sync service:', error);
      }
    };
  }, [fetchVehicles]);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  if (isLoading) {
    return <LoadingFallback message="Loading vehicle dashboard..." fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">Dashboard Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
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
