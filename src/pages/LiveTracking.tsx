
import React, { useState } from 'react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import LiveTrackingHeader from '@/components/tracking/LiveTrackingHeader';
import LiveTrackingStats from '@/components/tracking/LiveTrackingStats';
import LiveTrackingControls from '@/components/tracking/LiveTrackingControls';
import LiveTrackingContent from '@/components/tracking/LiveTrackingContent';
import LiveTrackingMap from '@/components/tracking/LiveTrackingMap';

const LiveTracking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'alerts'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('cards');

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

  // Create a typed handler for status filter changes
  const handleStatusFilterChange = (status: 'all' | 'online' | 'offline' | 'alerts') => {
    setStatusFilter(status);
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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <LiveTrackingStats 
        metrics={metrics}
        syncMetrics={syncMetrics}
        vehiclesByStatus={vehiclesByStatus}
      />

      <LiveTrackingControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onRefresh={forceRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Conditional Content Based on View Mode */}
      {viewMode === 'map' ? (
        <LiveTrackingMap
          vehicles={vehicles}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
        />
      ) : (
        <LiveTrackingContent
          viewMode={viewMode}
          vehicles={vehicles}
        />
      )}
    </div>
  );
};

export default LiveTracking;
