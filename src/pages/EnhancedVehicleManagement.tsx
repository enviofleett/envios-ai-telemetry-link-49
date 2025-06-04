
import React from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import VehicleCard from '@/components/vehicles/VehicleCard';
import VehicleFilters from '@/components/vehicles/VehicleFilters';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';

const EnhancedVehicleManagement = () => {
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
  } = useEnhancedVehicleData();

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing vehicles:', err);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading vehicles</div>
          <Button onClick={handleRefresh}>Retry</Button>
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
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-80"></div>
            </div>
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
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

export default EnhancedVehicleManagement;
