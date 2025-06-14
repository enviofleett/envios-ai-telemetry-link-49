import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  Activity, 
  AlertTriangle, 
  MapPin, 
  Gauge, 
  RefreshCw,
  Eye,
  Navigation
} from 'lucide-react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import VehicleDetailsModal from '@/components/vehicles/VehicleDetailsModal';
import MapTilerMap from '@/components/map/MapTilerMap';
import type { VehicleData } from '@/types/vehicle';

const UnifiedFleetDashboard: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const {
    vehicles,
    metrics,
    isLoading,
    isRefreshing,
    error,
    forceRefresh
  } = useUnifiedVehicleData();

  const getVehicleStatus = (vehicle: VehicleData) => {
    if (!vehicle.last_position?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.last_position.timestamp);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const mapVehicles = vehicles.filter(v => 
    v.last_position?.latitude && 
    v.last_position?.longitude &&
    !isNaN(v.last_position.latitude) &&
    !isNaN(v.last_position.longitude)
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-32 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="animate-pulse">
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={forceRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Dashboard</h1>
          <p className="text-gray-600">Monitor your entire fleet in real-time</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex rounded-md border border-gray-300">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="rounded-l-none"
            >
              Map
            </Button>
          </div>
          
          <Button
            onClick={forceRefresh}
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.total}</p>
              </div>
              <Car className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online</p>
                <p className="text-3xl font-bold text-green-600">{metrics.online}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offline</p>
                <p className="text-3xl font-bold text-gray-600">{metrics.offline}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alerts</p>
                <p className="text-3xl font-bold text-red-600">{metrics.alerts}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === 'map' ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Fleet Map View
              <Badge variant="outline" className="ml-2">
                {mapVehicles.length} vehicles with GPS
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mapVehicles.length > 0 ? (
              <MapTilerMap
                vehicles={mapVehicles}
                height="600px"
                onVehicleSelect={setSelectedVehicle}
                selectedVehicle={selectedVehicle}
                showControls={true}
              />
            ) : (
              <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No GPS Data</h3>
                  <p className="text-gray-500">
                    No vehicles with valid GPS coordinates found
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Vehicle Fleet
              <Badge variant="outline">
                {vehicles.length} vehicles
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.length === 0 ? (
              <div className="text-center py-8">
                <Car className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicles Found</h3>
                <p className="text-gray-500">
                  No vehicles are currently available in your fleet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => {
                  const status = getVehicleStatus(vehicle);
                  
                  return (
                    <Card 
                      key={vehicle.device_id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedVehicle(vehicle)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg">{vehicle.device_name}</h4>
                            <p className="text-sm text-gray-600">ID: {vehicle.device_id}</p>
                            {vehicle.license_plate && (
                              <p className="text-sm text-gray-500">{vehicle.license_plate}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                            <Badge variant="outline" className="text-xs">
                              {status}
                            </Badge>
                          </div>
                        </div>

                        {vehicle.last_position ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-1">
                                <Gauge className="h-4 w-4 text-gray-400" />
                                <span>{vehicle.last_position.speed || 0} km/h</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Navigation className="h-4 w-4 text-gray-400" />
                                <span>{vehicle.last_position.course || 0}°</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span className="text-xs">
                                {vehicle.last_position.latitude.toFixed(4)}, {vehicle.last_position.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No position data</p>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVehicle(vehicle);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <VehicleDetailsModal
          vehicle={selectedVehicle}
          isOpen={!!selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
        />
      )}
    </div>
  );
};

export default UnifiedFleetDashboard;
