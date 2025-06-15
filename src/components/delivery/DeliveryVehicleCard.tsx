
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { VehicleData } from '@/types/vehicle';

interface DeliveryVehicleCardProps {
  vehicle: VehicleData;
  isSelected: boolean;
  onSelect: (vehicle: VehicleData) => void;
}

const DeliveryVehicleCard: React.FC<DeliveryVehicleCardProps> = ({ vehicle, isSelected, onSelect }) => {
  const getStatusVariant = (status?: 'available' | 'delivering' | 'offline'): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'delivering': return 'default';
      case 'available': return 'secondary';
      case 'offline':
      default:
        return 'outline';
    }
  };
  
  const status = vehicle.deliveryStatus || 'offline';
  const driverName = vehicle.driver?.name || 'Unknown Driver';

  return (
    <Card
      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}
      onClick={() => onSelect(vehicle)}
    >
      <CardContent className="p-3 flex items-center space-x-4">
        <Avatar>
          <AvatarImage src={vehicle.driver?.avatarUrl} alt={driverName} />
          <AvatarFallback>{driverName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold">{driverName}</p>
          <p className="text-sm text-gray-500">{vehicle.device_name}</p>
        </div>
        <Badge variant={getStatusVariant(status)} className="capitalize">{status}</Badge>
      </CardContent>
    </Card>
  );
};

export default DeliveryVehicleCard;
