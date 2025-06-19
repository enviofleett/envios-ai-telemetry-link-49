
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealtimeVehicleData } from '@/hooks/useRealtimeVehicleData';
import EnhancedVehicleSearch from '@/components/vehicles/EnhancedVehicleSearch';
import RealtimeMapTilerMap from '@/components/map/RealtimeMapTilerMap';
import VehicleEventNotifications from '@/components/realtime/VehicleEventNotifications';
import RealtimeSyncStatus from '@/components/realtime/RealtimeSyncStatus';
import { RefreshCw, MapPin, List, Activity, Zap } from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';

const EnhancedLiveTracking: React.FC = () => {
  const { vehicles, isLoading, isConnected, forceSync } = useRealtimeVehicleData();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleData[]>([]);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const handleVehicleSelect = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
  };

  const getStatusColor = (vehicle: VehicleData) => {
    if (vehicle.isMoving) return 'bg-green-500';
    if (vehicle.isOnline) return 'bg-blue-500';
    return 'bg-red-500';
  };

  const getStatusLabel = (vehicle: VehicleData) => {
    if (vehicle.isMoving) return 'Moving';
    if (vehicle.isOnline) return 'Online';
    return 'Offline';
  };

  const onlineVehicles = vehicles.filter(v => v.isOnline);
  const movingVehicles = vehicles.filter(v => v.isMoving);
  const offlineVehicles = vehicles.filter(v => !v.isOnline);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading live tracking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Live Vehicle Tracking</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{isConnected ? 'Live Updates Active' : 'Connection Lost'}</span>
            </div>
            <span>{vehicles.length} total vehicles</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={forceSync} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Force Sync
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-2xl font-bold">{movingVehicles.length}</p>
                <p className="text-sm text-muted-foreground">Moving</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-2xl font-bold">{onlineVehicles.length}</p>
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div>
                <p className="text-2xl font-bold">{offlineVehicles.length}</p>
                <p className="text-sm text-muted-foreground">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{vehicles.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <EnhancedVehicleSearch
        vehicles={vehicles}
        onFilteredVehicles={setFilteredVehicles}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map and List View */}
        <div className="lg:col-span-3">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'map' | 'list')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                List View
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <RealtimeMapTilerMap
                    height="600px"
                    onVehicleSelect={handleVehicleSelect}
                    selectedVehicle={selectedVehicle}
                    autoFitBounds
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="list" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedVehicle?.id === vehicle.id ? 'ring-2 ring-primary bg-muted/30' : ''
                        }`}
                        onClick={() => handleVehicleSelect(vehicle)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle)}`} />
                          <div>
                            <p className="font-medium">{vehicle.device_name}</p>
                            <p className="text-sm text-muted-foreground">{vehicle.device_id}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {vehicle.last_position && (
                            <div className="text-right text-sm">
                              <p className="font-medium">{Math.round(vehicle.last_position.speed || 0)} km/h</p>
                              <p className="text-muted-foreground">Speed</p>
                            </div>
                          )}
                          
                          <Badge variant={vehicle.isOnline ? 'default' : 'secondary'}>
                            {getStatusLabel(vehicle)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          <RealtimeSyncStatus />
          <VehicleEventNotifications maxEvents={8} />
          
          {selectedVehicle && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vehicle Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{selectedVehicle.device_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.device_id}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(selectedVehicle)}`} />
                  <span className="text-sm">{getStatusLabel(selectedVehicle)}</span>
                </div>
                
                {selectedVehicle.last_position && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Speed:</span>
                      <span>{Math.round(selectedVehicle.last_position.speed || 0)} km/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span className="font-mono text-xs">
                        {selectedVehicle.last_position.latitude.toFixed(4)}, {selectedVehicle.last_position.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Update:</span>
                      <span>{selectedVehicle.lastUpdate.toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={() => window.location.href = `/vehicles?vehicle=${selectedVehicle.device_id}`}
                  className="w-full"
                  size="sm"
                >
                  View Full Details
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedLiveTracking;
