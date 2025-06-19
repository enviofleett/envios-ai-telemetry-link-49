
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MapPin, Settings, Activity } from 'lucide-react';
import { useEnhancedRealtimeVehicleData } from '@/hooks/useEnhancedRealtimeVehicleData';
import { useVehicles } from '@/hooks/useVehicles';
import { LiveTrackingStats } from './LiveTrackingStats';
import { LiveTrackingFilters } from './LiveTrackingFilters';
import { VehicleListPanel } from './VehicleListPanel';
import { LiveTrackingMap } from './LiveTrackingMap';
import { useToast } from '@/hooks/use-toast';
import type { VehicleData, FilterState } from '@/types/vehicle';

export default function EnhancedLiveTrackingPage() {
  const { toast } = useToast();
  const { vehicles: baseVehicles, isLoading: isLoadingVehicles } = useVehicles();
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    user: 'all',
    online: 'all'
  });
  
  // View state
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [showTrails, setShowTrails] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split');

  // Get user options for filters
  const userOptions = React.useMemo(() => {
    const users = new Map();
    baseVehicles.forEach(vehicle => {
      if (vehicle.envio_users) {
        users.set(vehicle.user_id, {
          id: vehicle.user_id,
          name: vehicle.envio_users.name || 'Unknown User',
          email: vehicle.envio_users.email || ''
        });
      }
    });
    return Array.from(users.values());
  }, [baseVehicles]);

  // Enhanced realtime data
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
    fallbackPollingInterval: 30000
  });

  // Apply filters to vehicles
  const filteredVehicles = React.useMemo(() => {
    return enhancedVehicles.filter(vehicle => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          vehicle.device_name?.toLowerCase().includes(searchLower) ||
          vehicle.device_id?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all') {
        switch (filters.status) {
          case 'online':
            if (!vehicle.isOnline) return false;
            break;
          case 'offline':
            if (vehicle.isOnline) return false;
            break;
          case 'active':
            if (!vehicle.isMoving) return false;
            break;
        }
      }

      // User filter
      if (filters.user !== 'all') {
        if (filters.user === 'unassigned') {
          if (vehicle.user_id) return false;
        } else {
          if (vehicle.user_id !== filters.user) return false;
        }
      }

      return true;
    });
  }, [enhancedVehicles, filters]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([
        refreshPositions(),
        showTrails ? forceRefreshTrails() : Promise.resolve()
      ]);
      
      toast({
        title: "Data Refreshed",
        description: "Vehicle positions and trails have been updated"
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: "Refresh Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Refresh Failed", 
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      }
    }
  }, [refreshPositions, forceRefreshTrails, showTrails, toast]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(handleRefresh, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, handleRefresh]);

  // Select first vehicle when vehicles change
  useEffect(() => {
    if (!selectedVehicle && filteredVehicles.length > 0) {
      setSelectedVehicle(filteredVehicles[0]);
    }
  }, [filteredVehicles, selectedVehicle]);

  if (isLoadingVehicles) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading vehicles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Vehicle Tracking</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and tracking of your fleet
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isWebSocketConnected ? "default" : "destructive"}>
            {isWebSocketConnected ? "Live" : "Offline"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoadingTrails}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTrails ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <LiveTrackingStats
        realtimeStats={realtimeStats}
        connectionState={connectionState}
      />

      {/* Filters */}
      <LiveTrackingFilters
        filters={filters}
        setFilters={setFilters}
        userOptions={userOptions}
      />

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>View Controls</span>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <Activity className="h-4 w-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('split')}
              >
                <Settings className="h-4 w-4 mr-1" />
                Split
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Show Vehicle Trails</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Auto Refresh (30s)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid gap-6" style={{
        gridTemplateColumns: viewMode === 'map' ? '1fr' : 
                           viewMode === 'list' ? '1fr' : 
                           '1fr 1fr'
      }}>
        {(viewMode === 'map' || viewMode === 'split') && (
          <Card>
            <CardHeader>
              <CardTitle>Live Map</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <LiveTrackingMap
                  vehicles={filteredVehicles}
                  selectedVehicle={selectedVehicle}
                  onVehicleSelect={setSelectedVehicle}
                  showTrails={showTrails}
                  vehicleTrails={vehicleTrails}
                  getVehicleTrail={getVehicleTrail}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {(viewMode === 'list' || viewMode === 'split') && (
          <VehicleListPanel
            vehicles={filteredVehicles}
            selectedVehicle={selectedVehicle}
            onVehicleSelect={setSelectedVehicle}
            showTrails={showTrails}
            getVehicleTrail={getVehicleTrail}
          />
        )}
      </div>

      {/* Error Display */}
      {realtimeError && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{realtimeError}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
