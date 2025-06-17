
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, Filter, RefreshCw } from 'lucide-react';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import type { VehicleData } from '@/types/vehicle';

const EnhancedLiveTracking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Use real vehicle data instead of mock data
  const { devices: vehicles, isLoading, error } = useDeviceManagement(searchTerm);

  const filteredVehicles = useMemo(() => {
    if (!vehicles) return [];
    
    return vehicles.filter(vehicle => {
      const matchesSearch = !searchTerm || 
        vehicle.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.device_id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'moving': return 'bg-blue-500';
      case 'idle': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vehicle tracking data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center py-8">
          <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Data</h3>
          <p className="text-gray-500">
            {error.message || 'Unable to load vehicle tracking data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Live Vehicle Tracking</h1>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring of your fleet vehicles
            </p>
          </div>
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="online">Online</option>
            <option value="moving">Moving</option>
            <option value="idle">Idle</option>
            <option value="offline">Offline</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{vehicle.device_name}</CardTitle>
                  <p className="text-sm text-gray-600">{vehicle.device_id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(vehicle.status)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Position Info */}
              {vehicle.last_position && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>
                      {vehicle.last_position.latitude.toFixed(4)}, {vehicle.last_position.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Speed: {vehicle.last_position.speed || 0} km/h</div>
                    <div>Course: {vehicle.last_position.course || 0}°</div>
                  </div>
                </div>
              )}

              {/* Alerts */}
              {vehicle.alerts && vehicle.alerts.length > 0 && (
                <div className="space-y-1">
                  {vehicle.alerts.map((alert, index) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {alert}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Last Update */}
              <div className="text-xs text-gray-500">
                Last update: {vehicle.lastUpdate ? vehicle.lastUpdate.toLocaleTimeString() : 'Unknown'}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No vehicles found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'No vehicles are currently being tracked. Import vehicle data to get started.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default EnhancedLiveTracking;
