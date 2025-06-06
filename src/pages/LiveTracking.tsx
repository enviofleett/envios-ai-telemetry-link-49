
import React, { useState } from 'react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import LiveTrackingHeader from '@/components/tracking/LiveTrackingHeader';
import LiveTrackingStats from '@/components/tracking/LiveTrackingStats';
import LiveMapAndVehicleList from '@/components/tracking/LiveMapAndVehicleList';
import ReportsHub from '@/components/tracking/ReportsHub';

const LiveTracking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'alerts'>('all');

  const { 
    vehicles, 
    metrics, 
    syncMetrics, 
    isLoading, 
    isRefreshing, 
    forceRefresh,
    getVehiclesByStatus 
  } = useUnifiedVehicleData({
    search: searchTerm,
    status: statusFilter
  });

  const vehiclesByStatus = getVehiclesByStatus();

  const handleVehicleSelect = (vehicle: any) => {
    console.log('Vehicle selected:', vehicle);
    // TODO: Implement vehicle selection logic
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-600 mt-2">Real-time vehicle location and status monitoring</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LiveTrackingHeader 
        viewMode="cards"
        onViewModeChange={() => {}}
      />

      <LiveTrackingStats 
        metrics={metrics}
        syncMetrics={syncMetrics}
        vehiclesByStatus={vehiclesByStatus}
      />

      <LiveMapAndVehicleList
        vehicles={vehicles}
        onVehicleSelect={handleVehicleSelect}
      />

      <ReportsHub
        vehicles={vehicles}
      />
    </div>
  );
};

export default LiveTracking;
