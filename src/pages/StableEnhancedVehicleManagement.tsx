
import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VehicleCard from '@/components/vehicles/VehicleCard';
import VehicleFilters from '@/components/vehicles/VehicleFilters';
import { useStableEnhancedVehicleData } from '@/hooks/useStableEnhancedVehicleData';
import LoadingFallback from '@/components/LoadingFallback';

const StableEnhancedVehicleManagement = () => {
  const {
    vehicles,
    filteredVehicles,
    userOptions,
    statistics,
    filters,
    setFilters,
    isLoading,
    error,
    refetch,
    handleVehicleAction
  } = useStableEnhancedVehicleData();

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing vehicles:', err);
    }
  };

  if (isLoading) {
    return <LoadingFallback message="Loading vehicles..." fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">Error loading vehicles</div>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your intelligent fleet</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Fleet Statistics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-900">{statistics.total}</div>
          <div className="text-sm text-blue-700">Total Vehicles</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-900">{statistics.active}</div>
          <div className="text-sm text-green-700">Active</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
          <div className="text-2xl font-bold text-emerald-900">{statistics.online}</div>
          <div className="text-sm text-emerald-700">Online</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-900">{statistics.alerts}</div>
          <div className="text-sm text-red-700">Alerts</div>
        </div>
      </div>

      {/* Filters */}
      <VehicleFilters
        filters={filters}
        onFiltersChange={setFilters}
        userOptions={userOptions}
        vehicleCount={vehicles.length}
        filteredCount={filteredVehicles.length}
      />

      {/* Vehicle Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {vehicles.length === 0 ? 'No vehicles found' : 'No vehicles match your filters'}
          </div>
          {vehicles.length > 0 && (
            <Button variant="outline" onClick={() => setFilters({
              search: '',
              status: 'all',
              user: 'all',
              online: 'all'
            })}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              associatedUser={vehicle.envio_users?.name}
              onViewMap={handleVehicleAction.viewMap}
              onViewHistory={handleVehicleAction.viewHistory}
              onViewDetails={handleVehicleAction.viewDetails}
              onSendCommand={handleVehicleAction.sendCommand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StableEnhancedVehicleManagement;
