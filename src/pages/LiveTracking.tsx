
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Gauge, 
  Search,
  RefreshCw,
  Car,
  Activity
} from 'lucide-react';

const LiveTracking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: vehicles, isLoading, refetch } = useQuery({
    queryKey: ['live-tracking-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('device_name');

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds for live data
  });

  const filteredVehicles = vehicles?.filter(vehicle =>
    vehicle.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.device_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getVehicleStatus = (vehicle: any) => {
    const position = vehicle.last_position as any;
    if (!position || !position.updatetime) return 'offline';
    
    const lastUpdate = new Date(position.updatetime);
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

  const getStatusBadge = (status: string) => {
    const colors = {
      online: 'bg-green-100 text-green-800',
      idle: 'bg-yellow-100 text-yellow-800',
      offline: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors] || colors.offline}>
        <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(status)}`}></div>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
          <p className="text-gray-600 mt-2">Real-time vehicle location and status monitoring</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Live Tracking</h1>
        <p className="text-gray-600 mt-2">
          Real-time vehicle location and status monitoring
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold">{filteredVehicles.length}</p>
              </div>
              <Car className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online Now</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredVehicles.filter(v => getVehicleStatus(v) === 'online').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Idle</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredVehicles.filter(v => getVehicleStatus(v) === 'idle').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offline</p>
                <p className="text-2xl font-bold text-gray-600">
                  {filteredVehicles.filter(v => getVehicleStatus(v) === 'offline').length}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Vehicle Tracking</span>
            <Button onClick={() => refetch()} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by vehicle name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredVehicles.map((vehicle) => {
          const position = vehicle.last_position as any;
          const status = getVehicleStatus(vehicle);
          
          return (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{vehicle.device_name}</h3>
                    <p className="text-sm text-gray-600">ID: {vehicle.device_id}</p>
                  </div>
                  {getStatusBadge(status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Location</span>
                    </div>
                    {position?.lat && position?.lon ? (
                      <p className="font-mono text-xs">
                        {position.lat.toFixed(4)}, {position.lon.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-gray-400">No location data</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Gauge className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Speed</span>
                    </div>
                    <p className="font-medium">
                      {position?.speed ? `${position.speed} km/h` : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Last Update</span>
                    </div>
                    <p className="text-xs">
                      {position?.updatetime 
                        ? new Date(position.updatetime).toLocaleString()
                        : 'No data'
                      }
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Navigation className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Direction</span>
                    </div>
                    <p className="font-medium">
                      {position?.direction ? `${position.direction}°` : 'N/A'}
                    </p>
                  </div>
                </div>

                {status === 'online' && (
                  <div className="mt-3 pt-3 border-t">
                    <Button size="sm" variant="outline" className="w-full">
                      <MapPin className="h-3 w-3 mr-1" />
                      View on Map
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredVehicles.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No vehicles found matching your search criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveTracking;
