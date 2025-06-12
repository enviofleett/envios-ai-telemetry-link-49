
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Battery, Clock, Gauge } from 'lucide-react';
import type { VehicleData } from '@/services/unifiedVehicleData';

interface CompactVehicleCardProps {
  vehicle: VehicleData;
  onClick?: (vehicle: VehicleData) => void;
  onTripClick?: (vehicle: VehicleData) => void;
  onAlertClick?: (vehicle: VehicleData) => void;
}

const CompactVehicleCard: React.FC<CompactVehicleCardProps> = ({
  vehicle,
  onClick,
  onTripClick,
  onAlertClick
}) => {
  const getVehicleStatus = () => {
    if (!vehicle.lastPosition?.timestamp) return 'offline';
    
    const lastUpdate = vehicle.lastPosition.timestamp;
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    return 'offline';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'online':
        return 'default';
      case 'offline':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getLastUpdateText = () => {
    if (!vehicle.lastPosition?.timestamp) return 'Never';
    
    const lastUpdate = vehicle.lastPosition.timestamp;
    const now = new Date();
    const minutesSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
    
    if (minutesSinceUpdate < 1) return 'Just now';
    if (minutesSinceUpdate === 1) return '1min ago';
    if (minutesSinceUpdate < 60) return `${minutesSinceUpdate}min ago`;
    
    const hours = Math.floor(minutesSinceUpdate / 60);
    if (hours === 1) return '1h ago';
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const status = getVehicleStatus();
  const speed = vehicle.lastPosition?.speed || 0;
  const battery = Math.floor(Math.random() * 100); // Mock battery data

  const handleCardClick = () => {
    onClick?.(vehicle);
  };

  const handleTripClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTripClick?.(vehicle);
  };

  const handleAlertClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAlertClick?.(vehicle);
  };

  return (
    <div 
      className="bg-white border border-gray-lighter rounded-lg p-3 mb-3 hover:bg-gray-background cursor-pointer transition-colors"
      onClick={handleCardClick}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-primary-dark">
          {vehicle.deviceName || vehicle.deviceId}
        </span>
        <Badge variant={getStatusVariant(status)} className="capitalize">
          {status}
        </Badge>
      </div>

      {/* Info Rows */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs">
          <Gauge className="w-3 h-3 text-gray-mid" />
          <span className="text-gray-mid">Speed:</span>
          <span className="text-primary-dark">{Math.round(speed)} km/h</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <Battery className="w-3 h-3 text-gray-mid" />
          <span className="text-gray-mid">Battery:</span>
          <span className="text-primary-dark">{battery}%</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-3 h-3 text-gray-mid" />
          <span className="text-gray-mid">Last:</span>
          <span className="text-primary-dark">{getLastUpdateText()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs bg-white border-gray-lighter text-primary-dark hover:bg-gray-background"
          onClick={handleTripClick}
        >
          Trip
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs bg-white border-gray-lighter text-primary-dark hover:bg-gray-background"
          onClick={handleAlertClick}
        >
          Alert
        </Button>
      </div>
    </div>
  );
};

export default CompactVehicleCard;
