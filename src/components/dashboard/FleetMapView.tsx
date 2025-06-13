
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Search, 
  Filter, 
  RefreshCw, 
  Gauge, 
  Navigation,
  Activity,
  AlertTriangle,
  Car
} from 'lucide-react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import MapTilerMap from '@/components/map/MapTilerMap';
import VehicleDetailsModal from './VehicleDetailsModal';
import type { VehicleData } from '@/types/vehicle';

const FleetMapView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  const { vehicles, isLoading, error, forceRefresh } = useUnifiedVehicleData();

  const getVehicleStatus = (vehicle: VehicleData) => {
    if (!vehicle.last_position?.timestamp) return 'offline';
    
    const lastUpdate = new Date(vehicle.last_position.timestamp);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    if (minutesSinceUpdate <= 30) return 'idle';
    return 'offline';
  };

  // Filter vehicles for map display
  const mapVehicles = useMemo(() => {
    return vehicles.filter(v => 
      v.last_position?.lat && 
      v.last_position?.lng &&
      !isNaN(v.last_position.lat) &&
      !isNaN(v.last_position.lng)
    );
  }, [vehicles]);

  // Filter vehicles for sidebar
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          vehicle.device_name.toLowerCase().includes(searchLower) ||
          vehicle.device_id.toLowerCase().includes(searchLower) ||
          (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const status = getVehicleStatus(vehicle);
        if (statusFilter !== status) return false;
      }

      return true;
    });
  }, [vehicles, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const handleVehicleSelect = (vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Map</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={forceRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Map Container */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="h-full bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Loading map...</p>
            </div>
          </div>
        ) : mapVehicles.length > 0 ? (
          <MapTilerMap
            vehicles={mapVehicles}
            height="100%"
            onVehicleSelect={handleVehicleSelect}
            selectedVehicle={selectedVehicle}
            showControls={true}
          />
        ) : (
          <div className="h-full bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Vehicle Locations</h3>
              <p className="text-gray-500">
                No vehicles with valid GPS coordinates found
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Fleet Vehicles</h2>
            <Button
              onClick={forceRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="idle">Idle</option>
              <option value="offline">Offline</option>
            </select>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse mb-4">
                  <div className="bg-gray-200 h-20 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredVehicles.length > 0 ? (
            <div className="p-4 space-y-3">
              {filteredVehicles.map((vehicle) => {
                const status = getVehicleStatus(vehicle);
                const isSelected = selectedVehicle?.device_id === vehicle.device_id;
                
                return (
                  <Card 
                    key={vehicle.device_id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{vehicle.device_name}</h4>
                          <p className="text-sm text-gray-500">ID: {vehicle.device_id}</p>
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
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1">
                              <Gauge className="h-3 w-3 text-gray-400" />
                              <span>{vehicle.last_position.speed || 0} km/h</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Navigation className="h-3 w-3 text-gray-400" />
                              <span>{vehicle.last_position.course || 0}°</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {vehicle.last_position.lat.toFixed(4)}, {vehicle.last_position.lng.toFixed(4)}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {new Date(vehicle.last_position.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <MapPin className="h-6 w-6 mx-auto text-gray-300 mb-1" />
                          <p className="text-xs text-gray-500">No location data</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center">
              <Car className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Vehicles Found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No vehicles available'
                }
              </p>
            </div>
          )}
        </div>
      </div>

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

export default FleetMapView;
