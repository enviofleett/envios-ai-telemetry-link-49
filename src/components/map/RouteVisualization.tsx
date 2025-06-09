
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Route, Clock, MapPin, Navigation } from 'lucide-react';
import StabilizedMapProvider from './StabilizedMapProvider';

interface RoutePoint {
  lat: number;
  lon: number;
  timestamp: string;
  speed?: number;
  address?: string;
}

interface RouteData {
  vehicleId: string;
  vehicleName: string;
  startTime: string;
  endTime: string;
  totalDistance: number;
  totalDuration: number;
  points: RoutePoint[];
  averageSpeed: number;
  maxSpeed: number;
}

interface RouteVisualizationProps {
  route?: RouteData;
  isLoading?: boolean;
  onRouteExport?: () => void;
  height?: string;
  className?: string;
}

const RouteVisualization: React.FC<RouteVisualizationProps> = ({
  route,
  isLoading = false,
  onRouteExport,
  height = "500px",
  className = ""
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!route) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No route data available</p>
          <p className="text-sm text-gray-400 mt-1">
            Select a vehicle and time period to view route history
          </p>
        </CardContent>
      </Card>
    );
  }

  // Convert route points to vehicle format for map display
  const routeVehicles = route.points.map((point, index) => ({
    deviceid: `route-point-${index}`,
    devicename: `Point ${index + 1}`,
    lastPosition: {
      lat: point.lat,
      lon: point.lon,
      speed: point.speed || 0,
      updatetime: point.timestamp
    }
  }));

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Route History: {route.vehicleName}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
            
            {onRouteExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRouteExport}
              >
                Export Route
              </Button>
            )}
          </div>
        </div>
        
        {/* Route Summary */}
        <div className="flex flex-wrap gap-4 mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              Duration: {formatDuration(route.totalDuration)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              Distance: {formatDistance(route.totalDistance)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-orange-500" />
            <span className="text-sm">
              Avg Speed: {route.averageSpeed} km/h
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Max Speed: {route.maxSpeed} km/h
            </Badge>
          </div>
        </div>

        {/* Detailed Information */}
        {showDetails && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Start:</span>
                <div className="text-gray-600">
                  {new Date(route.startTime).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="font-medium">End:</span>
                <div className="text-gray-600">
                  {new Date(route.endTime).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="font-medium">Points:</span>
                <div className="text-gray-600">
                  {route.points.length} recorded
                </div>
              </div>
              <div>
                <span className="font-medium">Vehicle:</span>
                <div className="text-gray-600">
                  {route.vehicleId}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <StabilizedMapProvider
          vehicles={routeVehicles}
          height={height}
          enableClustering={false}
          className="rounded-b-lg border-0"
        />
      </CardContent>
    </Card>
  );
};

export default RouteVisualization;
