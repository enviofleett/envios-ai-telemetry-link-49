
import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, MapPin, Clock, Gauge, Route, Phone, History, Navigation, Fuel, Battery } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { VehicleData } from '@/types/vehicle';

interface VehicleDetailsPanelProps {
  vehicle: VehicleData;
  expanded: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const VehicleDetailsPanel: React.FC<VehicleDetailsPanelProps> = ({
  vehicle,
  expanded,
  onClose,
  onToggle
}) => {
  const [geocodedAddress, setGeocodedAddress] = useState<string>('Loading address...');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Mock geocoding - replace with actual Google Geocoding service
  useEffect(() => {
    const geocodeLocation = async () => {
      if (!vehicle.lastPosition?.lat || !vehicle.lastPosition?.lon) {
        setGeocodedAddress('Location unavailable');
        return;
      }

      setIsGeocoding(true);
      try {
        // Mock delay for geocoding
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock address - replace with actual geocoding service call
        const mockAddress = `${Math.abs(vehicle.lastPosition.lat).toFixed(4)}°, ${Math.abs(vehicle.lastPosition.lon).toFixed(4)}° (Approx. Location)`;
        setGeocodedAddress(mockAddress);
      } catch (error) {
        setGeocodedAddress('Address unavailable');
      } finally {
        setIsGeocoding(false);
      }
    };

    geocodeLocation();
  }, [vehicle.lastPosition]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'moving':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'online':
      case 'moving':
        return 'default';
      case 'idle':
        return 'secondary';
      case 'offline':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className="shadow-lg border-t-2 border-blue-500 animate-slide-up">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
            <div>
              <CardTitle className="text-lg font-semibold text-slate-800">
                {vehicle.deviceName || vehicle.deviceId}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusBadgeVariant(vehicle.status)}>
                  {vehicle.status}
                </Badge>
                {vehicle.licensePlate && (
                  <span className="text-sm text-slate-600">{vehicle.licensePlate}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onToggle}>
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Location Information */}
            <div className="space-y-3">
              <h3 className="font-medium text-slate-800 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                Current Location
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-slate-600 min-w-0 flex-1">
                    {isGeocoding ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </div>
                    ) : (
                      geocodedAddress
                    )}
                  </span>
                </div>
                
                {vehicle.lastPosition && (
                  <div className="text-xs text-slate-500">
                    <p>Lat: {vehicle.lastPosition.lat.toFixed(6)}</p>
                    <p>Lon: {vehicle.lastPosition.lon.toFixed(6)}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  Updated {formatLastUpdate(vehicle.lastUpdate)}
                </div>
              </div>
            </div>

            {/* Vehicle Metrics */}
            <div className="space-y-3">
              <h3 className="font-medium text-slate-800 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-600" />
                Vehicle Metrics
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="h-3 w-3 text-slate-600" />
                    <span className="text-xs font-medium text-slate-600">Speed</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {vehicle.speed || 0} km/h
                  </p>
                </div>
                
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Route className="h-3 w-3 text-slate-600" />
                    <span className="text-xs font-medium text-slate-600">Course</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {vehicle.course || 0}°
                  </p>
                </div>
                
                {vehicle.fuel !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Fuel className="h-3 w-3 text-slate-600" />
                      <span className="text-xs font-medium text-slate-600">Fuel</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {vehicle.fuel}%
                    </p>
                  </div>
                )}
                
                {vehicle.battery !== undefined && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Battery className="h-3 w-3 text-slate-600" />
                      <span className="text-xs font-medium text-slate-600">Battery</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800">
                      {vehicle.battery}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="font-medium text-slate-800">Quick Actions</h3>
              
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Navigation className="h-4 w-4 mr-2" />
                  Track Vehicle
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Driver
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <History className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {vehicle.alerts && vehicle.alerts.length > 0 && (
            <>
              <Separator className="my-4" />
              <div>
                <h3 className="font-medium text-slate-800 mb-2">Active Alerts</h3>
                <div className="space-y-1">
                  {vehicle.alerts.map((alert, index) => (
                    <div key={index} className="text-sm text-amber-700 bg-amber-50 p-2 rounded border-l-2 border-amber-400">
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default VehicleDetailsPanel;
