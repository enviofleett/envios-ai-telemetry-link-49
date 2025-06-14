import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Car, 
  MapPin, 
  Activity, 
  AlertTriangle, 
  Search,
  Filter,
  RefreshCw,
  Users,
  Navigation,
  Gauge
} from 'lucide-react';
import { useUnifiedVehicleData } from '@/hooks/useUnifiedVehicleData';
import VehicleDetailsModal from '@/components/vehicles/VehicleDetailsModal'; // Adjusted path
import type { VehicleData } from '@/types/vehicle';

const UnifiedDashboard: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  const {
    vehicles,
    metrics,
    isLoading,
    isRefreshing,
    error,
    forceRefresh,
    // getVehiclesByStatus, // Commented out as not used in this version
    // getOnlineVehicles,  // Commented out as not used in this version
    // getOfflineVehicles // Commented out as not used in this version
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

  const filteredVehicles = vehicles.filter(vehicle => {
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

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={forceRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && vehicles.length === 0) {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Loading Skeleton for Header */}
                <div className="bg-white border-b border-gray-200 mb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                <div>
                                    <div className="h-6 w-48 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-4 w-64 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="h-9 w-24 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>

                {/* Loading Skeleton for Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-8 w-16 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Loading Skeleton for Filter/Search */}
                 <Card className="mb-8 animate-pulse">
                    <CardHeader>
                        <div className="h-6 w-40 bg-gray-200 rounded"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </CardContent>
                </Card>

                {/* Loading Skeleton for Vehicle List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                         <Card key={i} className="animate-pulse">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="h-5 w-32 bg-gray-200 rounded mb-1"></div>
                                        <div className="h-4 w-24 bg-gray-200 rounded"></div>
                                    </div>
                                    <div className="h-5 w-16 bg-gray-200 rounded"></div>
                                </div>
                                <div className="h-4 w-full bg-gray-200 rounded"></div>
                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-9 w-full bg-gray-200 rounded mt-2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Car className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fleet Dashboard</h1>
                <p className="text-sm text-gray-500">Unified vehicle management and tracking</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                onClick={forceRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        {/* Filters */}
        <div className="mb-6">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="search-vehicles" className="sr-only">Search Vehicles</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search-vehicles"
                    placeholder="Search by name, ID, or plate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="status-filter" className="sr-only">Status Filter</Label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="online">Online</option>
                  <option value="idle">Idle</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle List */}
        {isLoading && filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vehicles...</p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="text-center py-12">
            <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Vehicles Found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No vehicles available in your fleet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => {
              const status = getVehicleStatus(vehicle);
              return (
                <Card 
                  key={vehicle.device_id}
                  className="hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col justify-between"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{vehicle.device_name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                        <Badge variant="outline" className="text-xs">{status}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{vehicle.device_id}</p>
                    {vehicle.license_plate && (
                      <p className="text-xs text-gray-500">Plate: {vehicle.license_plate}</p>
                    )}
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {vehicle.last_position ? (
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Gauge className="h-4 w-4" /> Speed:
                          </div>
                          <span>{vehicle.last_position.speed || 0} km/h</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Navigation className="h-4 w-4" /> Course:
                          </div>
                          <span>{vehicle.last_position.course || 0}°</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-4 w-4" /> Location:
                          </div>
                          <span className="text-xs font-mono">
                            {vehicle.last_position.latitude.toFixed(4)}, {vehicle.last_position.longitude.toFixed(4)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 pt-1">
                          Last update: {formatLastUpdate(vehicle.last_position.timestamp)}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No position data</p>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => { e.stopPropagation(); setSelectedVehicle(vehicle); }}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {selectedVehicle && (
          <VehicleDetailsModal
            vehicle={selectedVehicle}
            isOpen={!!selectedVehicle}
            onClose={() => setSelectedVehicle(null)}
          />
        )}
      </div>
    </div>
  );
};

export default UnifiedDashboard;
