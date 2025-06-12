
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGP51VehicleData } from '@/hooks/useGP51VehicleData';
import { useGP51Auth } from '@/hooks/useGP51Auth';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Navigation, 
  Activity, 
  MapPin, 
  Clock,
  Gauge,
  Compass,
  AlertTriangle,
  Car,
  Signal
} from 'lucide-react';

export default function EnhancedLiveTrackingPage() {
  const { isAuthenticated, error: authError } = useGP51Auth();
  const { 
    vehicles, 
    metrics, 
    isLoading, 
    isRefreshing,
    forceRefresh,
    getOnlineVehicles,
    getOfflineVehicles,
    getMovingVehicles
  } = useGP51VehicleData({
    autoRefresh: true,
    refreshInterval: 30000
  });

  const { toast } = useToast();
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  // Select first vehicle by default
  useEffect(() => {
    if (vehicles.length > 0 && !selectedVehicle) {
      setSelectedVehicle(vehicles[0]);
    }
  }, [vehicles, selectedVehicle]);

  const handleRefresh = async () => {
    await forceRefresh();
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short'
    }).format(timestamp);
  };

  const getStatusColor = (vehicle: any) => {
    if (!vehicle.isOnline) return 'bg-gray-500';
    if (vehicle.isMoving) return 'bg-green-500 animate-pulse';
    return 'bg-blue-500';
  };

  const getStatusText = (vehicle: any) => {
    if (!vehicle.isOnline) return 'Offline';
    if (vehicle.isMoving) return 'Moving';
    return 'Idle';
  };

  if (authError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Authentication Error</h3>
            <p className="text-muted-foreground">{authError}</p>
            <Button 
              onClick={() => window.location.href = '/settings'} 
              className="mt-4"
            >
              Go to Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Signal className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">GP51 Connection Required</h3>
            <p className="text-muted-foreground mb-4">
              Please connect to GP51 to view live vehicle tracking data
            </p>
            <Button 
              onClick={() => window.location.href = '/settings'}
            >
              Connect to GP51
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading live vehicle data from GP51...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Live Vehicle Tracking</h2>
          <p className="text-muted-foreground">Real-time vehicle monitoring via GP51</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <div className={`h-2 w-2 rounded-full mr-2 ${metrics.syncStatus === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {metrics.syncStatus === 'success' ? 'Live - GP51' : 'Error'}
          </Badge>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Fleet Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Vehicles</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <Car className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{metrics.online}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Moving</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.moving}</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Idle</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.idle}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Fleet
            </CardTitle>
            <CardDescription>
              Select a vehicle to view live tracking details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {vehicles.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No vehicles found
              </p>
            ) : (
              vehicles.map((vehicle) => (
                <div
                  key={vehicle.deviceId}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedVehicle?.deviceId === vehicle.deviceId
                      ? 'bg-primary/10 border-primary'
                      : 'bg-background hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle)}`}></div>
                      <div>
                        <p className="font-medium">
                          {vehicle.vehicle_name || vehicle.deviceName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.deviceId}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(vehicle)}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Selected Vehicle Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedVehicle ? 
                (selectedVehicle.vehicle_name || selectedVehicle.deviceName) : 
                'Select Vehicle'
              }
            </CardTitle>
            <CardDescription>
              {selectedVehicle ? 
                `Device ID: ${selectedVehicle.deviceId}` : 
                'Choose a vehicle from the list to view live tracking data'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedVehicle ? (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a vehicle to view tracking details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Status and Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span className="font-medium">Status:</span>
                      <Badge variant={selectedVehicle.isOnline ? "default" : "secondary"}>
                        {getStatusText(selectedVehicle)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Last Update:</span>
                      <span className="text-sm">
                        {formatTimestamp(selectedVehicle.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      <span className="font-medium">Speed:</span>
                      <span className="text-sm">{selectedVehicle.speed} km/h</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4" />
                      <span className="font-medium">Heading:</span>
                      <span className="text-sm">{selectedVehicle.course}°</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedVehicle.latitude && selectedVehicle.longitude ? (
                      <>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">Position:</span>
                        </div>
                        <div className="text-sm space-y-1 ml-6">
                          <p>Lat: {selectedVehicle.latitude.toFixed(6)}</p>
                          <p>Lng: {selectedVehicle.longitude.toFixed(6)}</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>No position data available</span>
                      </div>
                    )}

                    {selectedVehicle.statusText && (
                      <div className="flex items-center gap-2">
                        <Signal className="h-4 w-4" />
                        <span className="font-medium">GPS Status:</span>
                        <span className="text-sm">{selectedVehicle.statusText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vehicle Details */}
                {(selectedVehicle.make || selectedVehicle.model || selectedVehicle.license_plate) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Vehicle Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedVehicle.make && (
                        <div><span className="text-muted-foreground">Make:</span> {selectedVehicle.make}</div>
                      )}
                      {selectedVehicle.model && (
                        <div><span className="text-muted-foreground">Model:</span> {selectedVehicle.model}</div>
                      )}
                      {selectedVehicle.year && (
                        <div><span className="text-muted-foreground">Year:</span> {selectedVehicle.year}</div>
                      )}
                      {selectedVehicle.license_plate && (
                        <div><span className="text-muted-foreground">License:</span> {selectedVehicle.license_plate}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                metrics.syncStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm">
                Last sync: {formatTimestamp(metrics.lastUpdateTime)}
              </span>
            </div>
            {metrics.errorMessage && (
              <div className="text-sm text-red-600">
                {metrics.errorMessage}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
