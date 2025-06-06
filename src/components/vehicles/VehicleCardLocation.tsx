
import React from 'react';
import { 
  MapPin, 
  Clock, 
  Gauge, 
  Navigation
} from 'lucide-react';

interface VehiclePosition {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  updatetime: string;
  statusText: string;
}

interface VehicleCardLocationProps {
  lastPosition?: VehiclePosition;
  formattedLocation: string | null;
  formattedLastUpdate: string | null;
}

const VehicleCardLocation: React.FC<VehicleCardLocationProps> = ({
  lastPosition,
  formattedLocation,
  formattedLastUpdate
}) => {
  if (!lastPosition) {
    return (
      <div className="text-center py-4 bg-gray-50 rounded-lg">
        <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No location data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="w-4 h-4 text-blue-500" />
        <span className="text-gray-700">{formattedLocation}</span>
      </div>
      
      {lastPosition.speed !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <Gauge className="w-4 h-4 text-green-500" />
          <span className="text-gray-700">
            {lastPosition.speed} km/h
          </span>
        </div>
      )}
      
      {lastPosition.course !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <Navigation className="w-4 h-4 text-purple-500" />
          <span className="text-gray-700">
            {lastPosition.course}°
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-2 text-sm">
        <Clock className="w-4 h-4 text-orange-500" />
        <span className="text-gray-700">{formattedLastUpdate}</span>
      </div>
    </div>
  );
};

export default VehicleCardLocation;
