
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Gauge,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Vehicle } from '@/types/vehicle';

interface VehiclePositionItemProps {
  vehicle: Vehicle;
}

const VehiclePositionItem: React.FC<VehiclePositionItemProps> = ({ vehicle }) => {
  const getVehicleStatusColor = (vehicle: Vehicle) => {
    if (!vehicle.last_position) return 'bg-gray-100 text-gray-800';
    
    const now = new Date();
    const positionTime = new Date(vehicle.last_position.updatetime);
    const minutesDiff = (now.getTime() - positionTime.getTime()) / (1000 * 60);

    if (minutesDiff > 30) return 'bg-red-100 text-red-800';
    if (vehicle.last_position.speed > 5) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getVehicleStatusIcon = (vehicle: Vehicle) => {
    if (!vehicle.last_position) return <WifiOff className="w-3 h-3" />;
    
    const now = new Date();
    const positionTime = new Date(vehicle.last_position.updatetime);
    const minutesDiff = (now.getTime() - positionTime.getTime()) / (1000 * 60);

    if (minutesDiff > 30) return <WifiOff className="w-3 h-3" />;
    return <Wifi className="w-3 h-3" />;
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Badge className={`flex items-center gap-1 ${getVehicleStatusColor(vehicle)}`}>
          {getVehicleStatusIcon(vehicle)}
          <span className="text-xs">
            {vehicle.last_position ? 
              (vehicle.last_position.speed > 5 ? 'Moving' : 'Stopped') : 
              'Offline'
            }
          </span>
        </Badge>
        <div>
          <div className="font-medium">{vehicle.device_name}</div>
          <div className="text-sm text-gray-600">ID: {vehicle.device_id}</div>
        </div>
      </div>
      
      {vehicle.last_position ? (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-blue-500" />
            <span>{vehicle.last_position.lat.toFixed(4)}, {vehicle.last_position.lon.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-green-500" />
            <span>{vehicle.last_position.speed} km/h</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-orange-500" />
            <span>{new Date(vehicle.last_position.updatetime).toLocaleTimeString()}</span>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No position data</div>
      )}
    </div>
  );
};

export default VehiclePositionItem;
