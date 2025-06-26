
import React from 'react';
import { Car, Wifi, WifiOff, Zap, PauseCircle } from 'lucide-react';
import MetricCard from './MetricCard';

interface VehicleStatusCardsProps {
  totalVehicles: number;
  onlineVehicles: number;
  offlineVehicles: number;
  movingVehicles: number;
  inactiveVehicles: number;
  isLoading?: boolean;
}

const VehicleStatusCards: React.FC<VehicleStatusCardsProps> = ({
  totalVehicles,
  onlineVehicles,
  offlineVehicles,
  movingVehicles,
  inactiveVehicles,
  isLoading = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Total Vehicles"
        value={totalVehicles}
        icon={Car}
        color="gray"
        isLoading={isLoading}
        subtitle="Fleet size"
      />
      
      <MetricCard
        title="Vehicles Online"
        value={onlineVehicles}
        icon={Wifi}
        color="green"
        isLoading={isLoading}
        subtitle="Connected & active"
        badge={{
          text: `${Math.round((onlineVehicles / totalVehicles) * 100) || 0}%`,
          variant: 'default'
        }}
      />
      
      <MetricCard
        title="Vehicles Offline"
        value={offlineVehicles}
        icon={WifiOff}
        color="red"
        isLoading={isLoading}
        subtitle="No connection"
        badge={{
          text: `${Math.round((offlineVehicles / totalVehicles) * 100) || 0}%`,
          variant: 'destructive'
        }}
      />
      
      <MetricCard
        title="Vehicles Moving"
        value={movingVehicles}
        icon={Zap}
        color="blue"
        isLoading={isLoading}
        subtitle="Currently in motion"
        badge={{
          text: "LIVE",
          variant: 'outline'
        }}
      />
      
      <MetricCard
        title="Inactive Vehicles"
        value={inactiveVehicles}
        icon={PauseCircle}
        color="orange"
        isLoading={isLoading}
        subtitle="Not in service"
      />
    </div>
  );
};

export default VehicleStatusCards;
