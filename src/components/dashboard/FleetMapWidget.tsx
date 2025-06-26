import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, RefreshCw, Car, Zap, AlertTriangle } from 'lucide-react';
import { useVehicleQuery } from '@/hooks/useVehicleQuery';
import type { VehicleData } from '@/types/vehicle';

export const FleetMapWidget: React.FC = () => {
  const { 
    vehicles, 
    isLoading, 
    error, 
    refetch
  } = useVehicleQuery();

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  const handleVehicleSelect = useCallback((vehicle: VehicleData) => {
    setSelectedVehicle(vehicle);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fleet Map
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading vehicles...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fleet Map
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading map data</p>
            <Button onClick={handleRefresh} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-96">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fleet Map
            <Badge variant="secondary">
              {vehicles.length} vehicles
            </Badge>
          </CardTitle>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64 overflow-y-auto">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedVehicle?.id === vehicle.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleVehicleSelect(vehicle)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span className="font-medium text-sm">
                    {vehicle.name || vehicle.device_name}
                  </span>
                </div>
                <Badge 
                  variant={vehicle.isOnline ? "default" : "secondary"}
                  className="text-xs"
                >
                  {vehicle.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  <span>Speed: {vehicle.speed || 0} km/h</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {vehicle.latitude?.toFixed(4)}, {vehicle.longitude?.toFixed(4)}
                  </span>
                </div>
                {vehicle.isMoving && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Zap className="h-3 w-3" />
                    <span>Moving</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
