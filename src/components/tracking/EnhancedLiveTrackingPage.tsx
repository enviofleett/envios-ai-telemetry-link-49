
import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LiveTrackingControls } from './LiveTrackingControls';
import { LiveTrackingStats } from './LiveTrackingStats';
import { VehicleListPanel } from './VehicleListPanel';
import { LiveTrackingMap } from './LiveTrackingMap';
import { useVehicleData } from '@/hooks/useVehicleData';
import { useEnhancedRealtimeVehicleData } from '@/hooks/useEnhancedRealtimeVehicleData';
import type { VehicleData, FilterState } from '@/types/vehicle';

const EnhancedLiveTrackingPage: React.FC = () => {
  const { toast } = useToast();
  
  // Filters state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    user: 'all',
    online: 'all'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [showTrails, setShowTrails] = useState(true);

  // Fetch vehicle data
  const { data: vehicles = [], isLoading, error, refetch } = useVehicleData();

  // Enhanced realtime data
  const {
    vehicles: enhancedVehicles,
    vehicleTrails,
    realtimeStats,
    connectionState,
    isWebSocketConnected,
    refreshPositions,
    getVehicleTrail
  } = useEnhancedRealtimeVehicleData(vehicles, {
    enableWebSocket: true,
    enableTrails: showTrails
  });

  // Filter vehicles based on current filters
  const filteredVehicles = useMemo(() => {
    return enhancedVehicles.filter(vehicle => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          vehicle.device_name.toLowerCase().includes(searchLower) ||
          vehicle.device_id.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'online' && !vehicle.isOnline) return false;
        if (filters.status === 'offline' && vehicle.isOnline) return false;
        if (filters.status === 'active' && !vehicle.isMoving) return false;
      }

      // User filter
      if (filters.user !== 'all') {
        if (filters.user === 'unassigned' && vehicle.user_id) return false;
        if (filters.user !== 'unassigned' && vehicle.user_id !== filters.user) return false;
      }

      return true;
    });
  }, [enhancedVehicles, filters]);

  // Get user options for filtering
  const userOptions = useMemo(() => {
    const uniqueUsers = new Map();
    enhancedVehicles.forEach(vehicle => {
      if (vehicle.user_id && vehicle.envio_users) {
        uniqueUsers.set(vehicle.user_id, {
          id: vehicle.user_id,
          name: vehicle.envio_users.name || 'Unknown User',
          email: vehicle.envio_users.email || ''
        });
      }
    });
    return Array.from(uniqueUsers.values());
  }, [enhancedVehicles]);

  const handleVehicleSelect = useCallback((vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      refreshPositions();
      toast({
        title: "Data Refreshed",
        description: "Vehicle data has been updated successfully."
      });
    } catch (err) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh vehicle data. Please try again.",
        variant: "destructive"
      });
    }
  }, [refetch, refreshPositions, toast]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <h3 className="text-lg font-semibold mb-2">Error Loading Vehicle Data</h3>
              <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Row */}
      <LiveTrackingStats 
        realtimeStats={realtimeStats}
        connectionState={connectionState}
      />

      {/* Controls */}
      <LiveTrackingControls
        filters={filters}
        onFiltersChange={setFilters}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        userOptions={userOptions}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle List */}
        <div className="lg:col-span-1">
          <VehicleListPanel
            vehicles={filteredVehicles}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={handleVehicleSelect}
            showTrails={showTrails}
            getVehicleTrail={getVehicleTrail}
          />
        </div>

        {/* Map */}
        <div className="lg:col-span-2">
          <Card className="h-[600px]">
            <CardContent className="p-0 h-full">
              <LiveTrackingMap
                vehicles={filteredVehicles}
                selectedVehicle={selectedVehicle}
                onVehicleSelect={handleVehicleSelect}
                showTrails={showTrails}
                vehicleTrails={vehicleTrails}
                getVehicleTrail={getVehicleTrail}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLiveTrackingPage;
