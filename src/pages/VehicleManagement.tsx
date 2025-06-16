
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Car, Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VehicleCard } from '@/components/vehicles/VehicleCard';
import VehicleProfileModal from '@/components/vehicles/VehicleProfileModal';
import { useStableEnhancedVehicleData } from '@/hooks/useStableEnhancedVehicleData';
import { useLiveVehicleData } from '@/hooks/useLiveVehicleData';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { VehicleData } from '@/types/vehicle';

const VehicleManagement: React.FC = () => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { 
    filteredVehicles,
    isLoading, 
    refetch,
    setFilters 
  } = useStableEnhancedVehicleData();

  const deviceIds = filteredVehicles.map(v => v.device_id);
  const { liveData, refreshData: refreshLiveData } = useLiveVehicleData({
    deviceIds,
    pollingInterval: 30000,
    enabled: deviceIds.length > 0
  });

  const { toast } = useToast();

  // Find the selected vehicle
  const selectedVehicle = selectedVehicleId 
    ? filteredVehicles.find(v => v.id === selectedVehicleId)
    : null;

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
      status: statusFilter as 'all' | 'online' | 'offline' | 'active',
    }));
  }, [searchTerm, statusFilter, setFilters]);

  const handleRefresh = async () => {
    await refetch();
    refreshLiveData();
    toast({
      title: 'Data refreshed',
      description: 'Vehicle data has been updated'
    });
  };

  const handleViewDetails = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  };

  const handleActivateWorkshop = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    // The modal will open with the workshops tab
  };

  const handleUpdateVehicle = async (vehicleId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', vehicleId);

      if (error) throw error;

      toast({
        title: 'Vehicle updated',
        description: 'Vehicle information has been saved'
      });

      // Refresh the vehicle data
      await refetch();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update vehicle information',
        variant: 'destructive'
      });
    }
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Car className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Vehicle Management</h1>
              <p className="text-sm text-muted-foreground">
                Monitor and manage your fleet vehicles with real-time tracking
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vehicles by name, ID, or plate..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="offline">Offline</option>
                <option value="moving">Moving</option>
                <option value="online">Online</option>
                <option value="idle">Idle</option>
              </select>
            </div>

            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Vehicle Grid */}
          {isLoading && filteredVehicles.length === 0 ? (
            <></> // Or a loading spinner for the grid
          ) : filteredVehicles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVehicles.map((vehicle) => {
                // Transform last_position for VehicleCard compatibility
                const vehicleForCard = {
                  ...vehicle,
                  last_position: vehicle.last_position ? {
                    lat: vehicle.last_position.latitude,
                    lng: vehicle.last_position.longitude,
                    speed: vehicle.last_position.speed || 0,
                    timestamp: vehicle.last_position.timestamp || new Date().toISOString(),
                  } : undefined,
                };

                return (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicleForCard}
                    liveData={liveData[vehicle.device_id]}
                    onViewDetails={handleViewDetails}
                    onActivateWorkshop={handleActivateWorkshop}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No vehicles found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No vehicles have been added to your fleet yet'
                }
              </p>
            </div>
          )}

          {/* Vehicle Profile Modal */}
          <VehicleProfileModal
            isOpen={!!selectedVehicleId}
            onClose={() => setSelectedVehicleId(null)}
            vehicle={selectedVehicle}
            liveData={selectedVehicle ? liveData[selectedVehicle.device_id] : undefined}
            onUpdateVehicle={handleUpdateVehicle}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default VehicleManagement;
