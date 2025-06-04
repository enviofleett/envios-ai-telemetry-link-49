
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

interface VehicleDashboardProps {
  vehicles: Vehicle[];
  onLogout: () => void;
}

const VehicleDashboard: React.FC<VehicleDashboardProps> = ({ vehicles, onLogout }) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call to refresh vehicle data
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

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
                onClick={onLogout}
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
            Real-time monitoring of your vehicle fleet
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
