
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, Map, Route, Shield, Search, Settings } from 'lucide-react';
import UniversalMapWidget from '@/components/map/UniversalMapWidget';
import RouteVisualization from '@/components/map/RouteVisualization';
import GeofenceManager from '@/components/map/GeofenceManager';
import MapSearchPanel from '@/components/map/MapSearchPanel';
import LiveTrackingContent from './LiveTrackingContent';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import type { Vehicle } from '@/services/unifiedVehicleData';

const EnhancedLiveTrackingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('live-tracking');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'map'>('map');
  const [mapFilters, setMapFilters] = useState({
    search: '',
    status: 'all' as 'all' | 'online' | 'offline' | 'alerts',
    user: 'all'
  });

  const { vehicles, allVehicles, isLoading } = useStableVehicleData(mapFilters);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    console.log('Vehicle selected:', vehicle);
  };

  const handleLocationSelect = (location: any) => {
    console.log('Location selected:', location);
    // TODO: Center map on selected location
  };

  const handleNavigateToLocation = (location: any) => {
    console.log('Navigate to location:', location);
    // TODO: Start navigation to location
  };

  // Mock route data for demonstration
  const mockRouteData = selectedVehicle ? {
    vehicleId: selectedVehicle.deviceid,
    vehicleName: selectedVehicle.devicename,
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    totalDistance: 15420, // meters
    totalDuration: 87, // minutes
    averageSpeed: 45,
    maxSpeed: 78,
    points: [
      {
        lat: -26.2041,
        lon: 28.0473,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        speed: 0,
        address: "Starting Point"
      },
      {
        lat: -26.1950,
        lon: 28.0536,
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        speed: 45,
        address: "Midway Point"
      },
      {
        lat: -26.1867,
        lon: 28.0601,
        timestamp: new Date().toISOString(),
        speed: 0,
        address: "Current Location"
      }
    ]
  } : undefined;

  // Mock geofence zones
  const mockGeofenceZones = [
    {
      id: '1',
      name: 'Office Complex',
      type: 'circular' as const,
      center: { lat: -26.2041, lon: 28.0473 },
      radius: 500,
      alertType: 'both' as const,
      isActive: true,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      triggeredCount: 23
    },
    {
      id: '2',
      name: 'Warehouse District',
      type: 'circular' as const,
      center: { lat: -26.1950, lon: 28.0536 },
      radius: 800,
      alertType: 'entry' as const,
      isActive: true,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      triggeredCount: 12
    },
    {
      id: '3',
      name: 'Restricted Area',
      type: 'circular' as const,
      center: { lat: -26.1867, lon: 28.0601 },
      radius: 300,
      alertType: 'both' as const,
      isActive: false,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      triggeredCount: 5
    }
  ];

  const getStatusCounts = () => {
    return allVehicles.reduce((acc, vehicle) => {
      if (!vehicle.lastPosition?.updatetime) {
        acc.offline++;
        return acc;
      }
      
      const lastUpdate = new Date(vehicle.lastPosition.updatetime);
      const now = new Date();
      const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
      
      if (minutesSinceUpdate <= 5) {
        acc.online++;
      } else if (minutesSinceUpdate <= 30) {
        acc.idle++;
      } else {
        acc.offline++;
      }
      
      return acc;
    }, { online: 0, idle: 0, offline: 0 });
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Enhanced Live Tracking</h1>
          <p className="text-muted-foreground">
            Comprehensive fleet monitoring with maps, routes, and geofencing
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {allVehicles.length} total vehicles
          </Badge>
          <Badge className="bg-green-500 text-white">
            {statusCounts.online} online
          </Badge>
          <Badge className="bg-yellow-500 text-white">
            {statusCounts.idle} idle
          </Badge>
          <Badge className="bg-gray-500 text-white">
            {statusCounts.offline} offline
          </Badge>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="live-tracking" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            Live Tracking
          </TabsTrigger>
          <TabsTrigger value="route-history" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Route History
          </TabsTrigger>
          <TabsTrigger value="geofencing" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Geofencing
          </TabsTrigger>
          <TabsTrigger value="location-search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Location Search
          </TabsTrigger>
          <TabsTrigger value="map-settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Map Settings
          </TabsTrigger>
        </TabsList>

        {/* Live Tracking Tab */}
        <TabsContent value="live-tracking" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Map - 3/4 width */}
            <div className="lg:col-span-3">
              <UniversalMapWidget
                title="Live Fleet Tracking"
                height="600px"
                enableFullscreen={true}
                enableControls={true}
                enableClustering={true}
                showVehicleCount={true}
                showStatusSummary={true}
                filters={mapFilters}
                onVehicleSelect={handleVehicleSelect}
                onFullscreenToggle={(isFullscreen) => {
                  console.log('Fullscreen toggled:', isFullscreen);
                }}
              />
            </div>
            
            {/* Side Panel - 1/4 width */}
            <div className="lg:col-span-1">
              <LiveTrackingContent
                viewMode="cards"
                vehicles={vehicles}
              />
            </div>
          </div>
        </TabsContent>

        {/* Route History Tab */}
        <TabsContent value="route-history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Vehicle for Route History</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedVehicle ? (
                <div className="flex items-center gap-2 mb-4">
                  <Badge>Selected: {selectedVehicle.devicename}</Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedVehicle(null)}
                  >
                    Clear Selection
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground mb-4">
                  Select a vehicle from the Live Tracking tab to view its route history
                </p>
              )}
            </CardContent>
          </Card>
          
          <RouteVisualization
            route={mockRouteData}
            isLoading={false}
            onRouteExport={() => console.log('Export route data')}
            height="500px"
          />
        </TabsContent>

        {/* Geofencing Tab */}
        <TabsContent value="geofencing">
          <GeofenceManager
            zones={mockGeofenceZones}
            onZoneCreate={(zone) => console.log('Create zone:', zone)}
            onZoneUpdate={(id, updates) => console.log('Update zone:', id, updates)}
            onZoneDelete={(id) => console.log('Delete zone:', id)}
            height="500px"
          />
        </TabsContent>

        {/* Location Search Tab */}
        <TabsContent value="location-search" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Search Panel - 1/3 width */}
            <div className="lg:col-span-1">
              <MapSearchPanel
                onLocationSelect={handleLocationSelect}
                onNavigateToLocation={handleNavigateToLocation}
                currentLocation={{ lat: -26.2041, lon: 28.0473 }}
              />
            </div>
            
            {/* Map - 2/3 width */}
            <div className="lg:col-span-2">
              <UniversalMapWidget
                title="Location Search Results"
                height="600px"
                enableFullscreen={true}
                enableControls={true}
                enableClustering={false}
                showVehicleCount={false}
                showStatusSummary={false}
                filters={{ status: 'all' }}
              />
            </div>
          </div>
        </TabsContent>

        {/* Map Settings Tab */}
        <TabsContent value="map-settings">
          <Card>
            <CardHeader>
              <CardTitle>Map Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Map provider settings and API configuration can be managed in the Admin Settings.
                </p>
                <Button onClick={() => window.open('/admin', '_blank')}>
                  Open Admin Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedLiveTrackingPage;
