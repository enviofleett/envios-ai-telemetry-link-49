
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useStableEnhancedVehicleData } from '@/hooks/useStableEnhancedVehicleData';
import { useEnhancedRealtimeVehicleData } from '@/hooks/useEnhancedRealtimeVehicleData';
import { LiveTrackingStats } from './LiveTrackingStats';
import { LiveTrackingFilters } from './LiveTrackingFilters';
import { VehicleListPanel } from './VehicleListPanel';
import MapTilerMap from '@/components/map/MapTilerMap';
import { VehicleData, FilterState } from '@/types/vehicle';
import { RefreshCw, Map, List, Settings, Activity } from 'lucide-react';

const EnhancedLiveTrackingPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    user: 'all',
    online: 'all'
  });
  const [showTrails, setShowTrails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split');

  // Get base vehicle data
  const {
    vehicles: baseVehicles,
    filteredVehicles,
    isLoading: isBaseLoading,
    userOptions,
    setFilters: setBaseFilters
  } = useStableEnhancedVehicleData();

  // Enhanced with real-time data
  const {
    vehicles: enhancedVehicles,
    vehicleTrails,
    isLoadingTrails,
    realtimeStats,
    connectionState,
    error: realtimeError,
    isWebSocketConnected,
    refreshPositions,
    getVehicleTrail,
    forceRefreshTrails
  } = useEnhancedRealtimeVehicleData(baseVehicles, {
    enableWebSocket: true,
    enableTrails: showTrails,
    trailHours: 6,
    fallbackPollingInterval: 30000,
    maxPositionAge: 10
  });

  // Apply filters to enhanced vehicles
  const displayVehicles = enhancedVehicles.filter(vehicle => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        vehicle.device_name.toLowerCase().includes(searchTerm) ||
        vehicle.device_id.toLowerCase().includes(searchTerm);
      
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      if (filters.status === 'online' && !vehicle.isOnline) return false;
      if (filters.status === 'offline' && vehicle.isOnline) return false;
      if (filters.status === 'active' && !vehicle.is_active) return false;
    }

    // User filter
    if (filters.user !== 'all') {
      if (filters.user === 'unassigned' && vehicle.user_id) return false;
      if (filters.user !== 'unassigned' && vehicle.user_id !== filters.user) return false;
    }

    return true;
  });

  // Handle real-time errors
  useEffect(() => {
    if (realtimeError) {
      const errorMessage = typeof realtimeError === 'string' 
        ? realtimeError 
        : realtimeError instanceof Error 
          ? realtimeError.message 
          : 'Unknown real-time error';
          
      toast({
        title: "Real-time Connection Issue",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [realtimeError, toast]);

  // Auto-select first vehicle
  useEffect(() => {
    if (displayVehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(displayVehicles[0]);
    }
  }, [displayVehicles, selectedVehicle]);

  // Auto-refresh logic
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (isWebSocketConnected) {
        refreshPositions();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, isWebSocketConnected, refreshPositions]);

  const handleRefreshAll = () => {
    refreshPositions();
    if (showTrails) {
      forceRefreshTrails();
    }
    toast({
      title: "Refreshing Data",
      description: "Updating vehicle positions and trails..."
    });
  };

  const handleTrailToggle = (enabled: boolean) => {
    setShowTrails(enabled);
    if (enabled) {
      toast({
        title: "Loading Vehicle Trails",
        description: "Fetching historical position data..."
      });
    }
  };

  if (isBaseLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-4">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading live tracking data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Vehicle Tracking</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of {displayVehicles.length} vehicles
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Badge variant={isWebSocketConnected ? "default" : "destructive"}>
            <Activity className="w-3 h-3 mr-1" />
            {isWebSocketConnected ? 'Live' : 'Offline'}
          </Badge>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('map')}
              className={viewMode === 'map' ? 'bg-accent' : ''}
            >
              <Map className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-accent' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('split')}
              className={viewMode === 'split' ? 'bg-accent' : ''}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={handleRefreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      <LiveTrackingStats 
        realtimeStats={realtimeStats}
        connectionState={connectionState}
      />

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-trails"
                checked={showTrails}
                onCheckedChange={handleTrailToggle}
                disabled={isLoadingTrails}
              />
              <Label htmlFor="show-trails">
                Show Trails {isLoadingTrails && '(Loading...)'}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6" style={{
        gridTemplateColumns: viewMode === 'map' ? '1fr' : 
                           viewMode === 'list' ? '1fr' : 
                           '300px 1fr'
      }}>
        {/* Filters and Vehicle List */}
        {(viewMode === 'list' || viewMode === 'split') && (
          <div className="space-y-4">
            <LiveTrackingFilters
              filters={filters}
              setFilters={setFilters}
              userOptions={userOptions}
            />

            {viewMode === 'split' && (
              <VehicleListPanel
                vehicles={displayVehicles}
                selectedVehicle={selectedVehicle}
                onVehicleSelect={setSelectedVehicle}
                showTrails={showTrails}
                getVehicleTrail={getVehicleTrail}
              />
            )}
          </div>
        )}

        {/* Map or Vehicle Details */}
        {(viewMode === 'map' || viewMode === 'split') && (
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Live Map View
                {selectedVehicle && (
                  <Badge variant="outline">
                    {selectedVehicle.device_name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full p-0">
              <MapTilerMap
                vehicles={displayVehicles}
                selectedVehicle={selectedVehicle}
                onVehicleSelect={setSelectedVehicle}
                height="500px"
                showControls={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Full Vehicle List (List View Only) */}
        {viewMode === 'list' && (
          <VehicleListPanel
            vehicles={displayVehicles}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
            showTrails={showTrails}
            getVehicleTrail={getVehicleTrail}
          />
        )}
      </div>
    </div>
  );
};

export default EnhancedLiveTrackingPage;
