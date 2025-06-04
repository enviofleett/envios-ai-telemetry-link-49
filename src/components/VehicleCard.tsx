
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Gauge, 
  Navigation,
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

interface VehicleCardProps {
  vehicle: Vehicle;
}

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

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white/80 backdrop-blur-sm">
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
  );
};

export default VehicleCard;
