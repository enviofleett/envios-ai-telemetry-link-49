
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Car, 
  User, 
  MapPin, 
  Gauge, 
  Calendar,
  Settings,
  Wrench
} from 'lucide-react';

interface VehicleCardProps {
  vehicle: {
    id: string;
    device_id: string;
    device_name: string;
    vin?: string;
    license_plate?: string;
    image_urls?: string[];
    is_active: boolean;
    envio_user_id?: string;
    last_position?: {
      lat: number;
      lng: number;
      speed: number;
      timestamp: string;
    };
    insurance_expiration_date?: string;
    license_expiration_date?: string;
    envio_users?: {
      name?: string; // Made optional to match VehicleData
      email?: string; // Made optional to match VehicleData
    };
  };
  liveData?: {
    speed: number;
    status: 'online' | 'offline' | 'moving';
    lastUpdate: Date;
  };
  onViewDetails: (vehicleId: string) => void;
  onActivateWorkshop: (vehicleId: string) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  liveData,
  onViewDetails,
  onActivateWorkshop
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'moving': return 'bg-blue-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'moving': return 'Moving';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  const isDocumentExpiring = (date?: string) => {
    if (!date) return false;
    const expirationDate = new Date(date);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expirationDate <= thirtyDaysFromNow;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {vehicle.image_urls && vehicle.image_urls.length > 0 ? (
              <img
                src={vehicle.image_urls[0]}
                alt={vehicle.device_name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{vehicle.device_name}</h3>
              <p className="text-sm text-gray-600">{vehicle.license_plate || 'No plate'}</p>
              {vehicle.vin && (
                <p className="text-xs text-gray-500">VIN: {vehicle.vin.slice(-6)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(liveData?.status)}`} />
            <Badge variant="outline" className="text-xs">
              {getStatusText(liveData?.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Live Data */}
        {liveData && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Gauge className="h-4 w-4 text-gray-400" />
              <span>{liveData.speed} km/h</span>
            </div>
            {vehicle.last_position && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-xs">
                  {vehicle.last_position.lat.toFixed(4)}, {vehicle.last_position.lng.toFixed(4)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Assigned User */}
        {vehicle.envio_users && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span>{vehicle.envio_users.name}</span>
          </div>
        )}

        {/* Document Expiration Alerts */}
        {(vehicle.insurance_expiration_date || vehicle.license_expiration_date) && (
          <div className="space-y-1">
            {vehicle.insurance_expiration_date && isDocumentExpiring(vehicle.insurance_expiration_date) && (
              <div className="flex items-center gap-2 text-xs text-orange-600">
                <Calendar className="h-3 w-3" />
                <span>Insurance expires soon</span>
              </div>
            )}
            {vehicle.license_expiration_date && isDocumentExpiring(vehicle.license_expiration_date) && (
              <div className="flex items-center gap-2 text-xs text-orange-600">
                <Calendar className="h-3 w-3" />
                <span>License expires soon</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(vehicle.id)}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-1" />
            Details
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onActivateWorkshop(vehicle.id)}
            className="flex-1"
          >
            <Wrench className="h-4 w-4 mr-1" />
            Workshop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
