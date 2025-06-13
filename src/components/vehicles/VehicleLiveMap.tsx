
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Gauge } from 'lucide-react';

interface VehicleLiveMapProps {
  vehicle: {
    id: string;
    device_name: string;
    last_position?: {
      lat: number;
      lng: number;
      speed: number;
      timestamp: string;
    };
  };
  liveData?: {
    speed: number;
    status: 'online' | 'offline' | 'moving';
    lastUpdate: Date;
  };
}

export const VehicleLiveMap: React.FC<VehicleLiveMapProps> = ({
  vehicle,
  liveData
}) => {
  const formatLastUpdate = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Live Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Live Vehicle Status
            {liveData && (
              <Badge className={`ml-2 ${
                liveData.status === 'online' ? 'bg-green-500' :
                liveData.status === 'moving' ? 'bg-blue-500' : 'bg-gray-400'
              }`}>
                {liveData.status}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {liveData && (
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Current Speed</p>
                  <p className="font-semibold">{liveData.speed} km/h</p>
                </div>
              </div>
            )}
            
            {vehicle.last_position && (
              <>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-mono text-sm">
                      {vehicle.last_position.lat.toFixed(6)}, {vehicle.last_position.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Last Update</p>
                    <p className="font-semibold text-sm">
                      {formatLastUpdate(liveData?.lastUpdate || vehicle.last_position.timestamp)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Location Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
            <div className="text-center">
              <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map Coming Soon</h3>
              <p className="text-gray-500 mb-4">
                Live vehicle tracking map will be integrated here
              </p>
              {vehicle.last_position && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">Current Coordinates:</p>
                  <p className="font-mono text-sm">
                    Lat: {vehicle.last_position.lat.toFixed(6)}
                  </p>
                  <p className="font-mono text-sm">
                    Lng: {vehicle.last_position.lng.toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${vehicle.last_position.lat},${vehicle.last_position.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 text-sm mt-2 inline-block"
                  >
                    View on Google Maps →
                  </a>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
