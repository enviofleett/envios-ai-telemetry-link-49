
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Navigation, MapPin, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MapDisplay from '@/components/maps/MapDisplay';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import { geocodingService } from '@/services/maps/geocodingService';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
}

const LiveTracking: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [vehicleAddress, setVehicleAddress] = useState<string>('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  
  // Use stable vehicle data with error handling
  const { vehicles, metrics, isLoading, error, forceRefresh } = useStableVehicleData({});

  // Convert vehicles to map markers
  const mapMarkers: MapMarker[] = vehicles
    .filter(vehicle => vehicle.lastPosition?.lat && vehicle.lastPosition?.lon)
    .map(vehicle => {
      const getStatusColor = () => {
        if (!vehicle.lastPosition?.timestamp) return '#6b7280'; // gray
        
        const lastUpdate = new Date(vehicle.lastPosition.timestamp);
        const now = new Date();
        const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
        
        if (minutesSinceUpdate <= 5) return '#10b981'; // green - online
        if (minutesSinceUpdate <= 30) return '#f59e0b'; // yellow - idle
        return '#ef4444'; // red - offline
      };

      return {
        id: vehicle.deviceId,
        latitude: vehicle.lastPosition!.lat,
        longitude: vehicle.lastPosition!.lon,
        title: vehicle.deviceName || vehicle.deviceId,
        description: `Speed: ${vehicle.lastPosition?.speed || 0} km/h`,
        color: getStatusColor()
      };
    });

  // Handle marker click
  const handleMarkerClick = async (marker: MapMarker) => {
    const vehicle = vehicles.find(v => v.deviceId === marker.id);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      
      // Get address for selected vehicle
      if (vehicle.lastPosition?.lat && vehicle.lastPosition?.lon) {
        setIsLoadingAddress(true);
        try {
          const address = await geocodingService.reverseGeocodeCoordinates(
            vehicle.lastPosition.lat,
            vehicle.lastPosition.lon
          );
          setVehicleAddress(address || 'Address not available');
        } catch (error) {
          console.error('Failed to get address:', error);
          setVehicleAddress('Failed to load address');
        } finally {
          setIsLoadingAddress(false);
        }
      }
    }
  };

  // Handle vehicle list item click
  const handleVehicleSelect = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
    
    // If vehicle has position, get address
    if (vehicle.lastPosition?.lat && vehicle.lastPosition?.lon) {
      handleMarkerClick({
        id: vehicle.deviceId,
        latitude: vehicle.lastPosition.lat,
        longitude: vehicle.lastPosition.lon
      });
    }
  };

  const getVehicleStatus = (vehicle: VehicleData) => {
    if (!vehicle.lastPosition?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.timestamp);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online': return 'default';
      case 'idle': return 'secondary';
      default: return 'destructive';
    }
  };

  if (error) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Navigation className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Live Tracking</h1>
                <p className="text-sm text-muted-foreground">
                  Real-time vehicle location monitoring and fleet tracking
                </p>
              </div>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-red-600">
                  Error loading vehicle data: {error}
                  <div className="mt-4">
                    <Button onClick={forceRefresh} variant="outline">
                      Retry
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Navigation className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Live Tracking</h1>
              <p className="text-sm text-muted-foreground">
                Real-time vehicle location monitoring and fleet tracking
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Online</p>
                    <p className="text-2xl font-bold">{metrics.online}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Idle</p>
                    <p className="text-2xl font-bold">{metrics.idle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Offline</p>
                    <p className="text-2xl font-bold">{metrics.offline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-2xl font-bold">{metrics.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Display */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Map</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Loading vehicles...</p>
                      </div>
                    </div>
                  ) : (
                    <MapDisplay
                      markers={mapMarkers}
                      height="400px"
                      onMarkerClick={handleMarkerClick}
                      className="rounded-lg"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Vehicle List */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Vehicles ({vehicles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {vehicles.map((vehicle) => {
                      const status = getVehicleStatus(vehicle);
                      return (
                        <div
                          key={vehicle.deviceId}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                            selectedVehicle?.deviceId === vehicle.deviceId ? 'bg-blue-50 border-blue-200' : ''
                          }`}
                          onClick={() => handleVehicleSelect(vehicle)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {vehicle.deviceName || vehicle.deviceId}
                              </p>
                              {vehicle.lastPosition && (
                                <p className="text-xs text-gray-600">
                                  Speed: {vehicle.lastPosition.speed} km/h
                                </p>
                              )}
                            </div>
                            <Badge variant={getStatusBadgeVariant(status)} className="text-xs">
                              {status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Vehicle Details Panel */}
          {selectedVehicle && (
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Details - {selectedVehicle.deviceName || selectedVehicle.deviceId}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge variant={getStatusBadgeVariant(getVehicleStatus(selectedVehicle))}>
                      {getVehicleStatus(selectedVehicle)}
                    </Badge>
                  </div>
                  
                  {selectedVehicle.lastPosition && (
                    <>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Speed</p>
                        <p className="text-lg font-semibold">{selectedVehicle.lastPosition.speed} km/h</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">Coordinates</p>
                        <p className="text-sm font-mono">
                          {selectedVehicle.lastPosition.lat.toFixed(6)}, {selectedVehicle.lastPosition.lon.toFixed(6)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600">Last Update</p>
                        <p className="text-sm">{selectedVehicle.lastPosition.timestamp.toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Address Information */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-600 mb-2">Current Location</p>
                  {isLoadingAddress ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm text-gray-600">Loading address...</span>
                    </div>
                  ) : vehicleAddress ? (
                    <p className="text-sm">{vehicleAddress}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Address not available</p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline">
                    View History
                  </Button>
                  <Button size="sm">
                    Track Live
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default LiveTracking;
