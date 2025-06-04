
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  MapPin, 
  Clock, 
  Gauge, 
  Navigation, 
  LogOut, 
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { telemetryApi } from '@/services/telemetryApi';

interface Vehicle {
  deviceid: string;
  devicename: string;
  status?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
}

const VehicleDashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'online':
        return <Wifi className="w-3 h-3" />;
      case 'inactive':
      case 'offline':
        return <WifiOff className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const fetchVehicles = async () => {
    try {
      console.log('Fetching vehicles...');
      const result = await telemetryApi.getVehicleList();
      
      if (result.success && result.vehicles) {
        console.log('Vehicles received:', result.vehicles);
        setVehicles(result.vehicles);
      } else {
        console.error('Failed to fetch vehicles:', result.error);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      console.log('Fetching vehicle positions...');
      const deviceIds = vehicles.map(v => v.deviceid);
      if (deviceIds.length === 0) return;
      
      const result = await telemetryApi.getVehiclePositions(deviceIds);
      
      if (result.success && result.positions) {
        console.log('Positions received:', result.positions);
        
        // Update vehicles with position data
        setVehicles(currentVehicles => 
          currentVehicles.map(vehicle => {
            const position = result.positions?.find(p => p.deviceid === vehicle.deviceid);
            if (position) {
              return {
                ...vehicle,
                lastPosition: {
                  lat: position.lat,
                  lon: position.lon,
                  speed: position.speed,
                  course: position.course,
                  updatetime: position.updatetime,
                  statusText: position.statusText
                }
              };
            }
            return vehicle;
          })
        );
        
        setLastUpdate(new Date());
      } else {
        console.error('Failed to fetch positions:', result.error);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPositions();
    setIsRefreshing(false);
  };

  const handleLogout = () => {
    telemetryApi.clearSession();
    window.location.reload();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Fetch initial vehicles and positions
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch positions when vehicles are loaded
  useEffect(() => {
    if (vehicles.length > 0) {
      fetchPositions();
      
      // Set up periodic position updates every 30 seconds
      const positionInterval = setInterval(fetchPositions, 30000);
      
      return () => {
        clearInterval(positionInterval);
      };
    }
  }, [vehicles.length]);

  // Update timestamp every second
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Dashboard</h1>
                <p className="text-sm text-gray-600">
                  Last updated: {formatTime(lastUpdate)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                disabled={isRefreshing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Fleet Overview ({vehicles.length} vehicles)
          </h2>
          <p className="text-gray-600">
            Real-time monitoring of your vehicle fleet via GP51 Telemetry
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.deviceid} className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {vehicle.devicename}
                  </CardTitle>
                  <Badge className={`flex items-center space-x-1 ${getStatusColor(vehicle.status)}`}>
                    {getStatusIcon(vehicle.status)}
                    <span className="text-xs font-medium">
                      {vehicle.status || 'Unknown'}
                    </span>
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">ID: {vehicle.deviceid}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {vehicle.lastPosition ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">
                        {vehicle.lastPosition.lat.toFixed(6)}, {vehicle.lastPosition.lon.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Gauge className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">
                        {vehicle.lastPosition.speed} km/h
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Navigation className="w-4 h-4 text-purple-500" />
                      <span className="text-gray-600">
                        Course: {vehicle.lastPosition.course}°
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-600">
                        {new Date(vehicle.lastPosition.updatetime).toLocaleString()}
                      </span>
                    </div>
                    {vehicle.lastPosition.statusText && (
                      <div className="text-xs text-gray-500 mt-2">
                        Status: {vehicle.lastPosition.statusText}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MapPin className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">No position data available</p>
                  </div>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors"
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
            <p className="text-gray-600">No vehicles are currently associated with your account.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleDashboard;
