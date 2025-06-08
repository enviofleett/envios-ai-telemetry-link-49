
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import { useVehicleControls } from '@/hooks/useVehicleControls';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw } from 'lucide-react';
import VehicleTelemetryCard from './VehicleTelemetryCard';
import VehicleControlsPanel from './VehicleControlsPanel';
import FleetMapCard from './FleetMapCard';
import FleetStatusTable from './FleetStatusTable';

export function EnhancedLiveTracking() {
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const { toast } = useToast();
  
  const { 
    vehicles, 
    metrics, 
    isLoading, 
    forceRefresh 
  } = useUnifiedVehicleData({
    search: '',
    status: 'all'
  });

  const {
    controlStates,
    isUpdating,
    toggleEngine,
    toggleLock
  } = useVehicleControls(vehicles);

  // Initialize selected vehicle
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles, selectedVehicle]);

  const handleRefresh = async () => {
    await forceRefresh();
    toast({
      title: "Data Refreshed",
      description: "Vehicle data has been updated from GP51"
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading live vehicle data...</span>
      </div>
    );
  }

  if (!selectedVehicle) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">No vehicles available for live tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Live Vehicle Tracking</h2>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
            Live - GP51
          </Badge>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Vehicle Telemetry and Controls Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VehicleTelemetryCard
            selectedVehicle={selectedVehicle}
            controlStates={controlStates}
          />
        </div>
        <div>
          <VehicleControlsPanel
            selectedVehicle={selectedVehicle}
            controlStates={controlStates}
            isUpdating={isUpdating}
            onToggleEngine={toggleEngine}
            onToggleLock={toggleLock}
          />
        </div>
      </div>

      {/* Fleet Map */}
      <FleetMapCard
        vehicles={vehicles}
        onVehicleSelect={setSelectedVehicle}
      />

      {/* Fleet Status Table */}
      <FleetStatusTable
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        controlStates={controlStates}
        onVehicleSelect={setSelectedVehicle}
      />
    </div>
  );
}
