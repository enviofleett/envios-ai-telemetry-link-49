
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { VehicleData } from '@/types/vehicle';
import DeliveryVehicleCard from './DeliveryVehicleCard';

interface DeliveryVehiclesPanelProps {
  vehicles: VehicleData[];
  selectedVehicle: VehicleData | null;
  onVehicleSelect: (vehicle: VehicleData) => void;
}

const DeliveryVehiclesPanel: React.FC<DeliveryVehiclesPanelProps> = ({ vehicles, selectedVehicle, onVehicleSelect }) => {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Delivery Vehicles</h2>
        <p className="text-sm text-gray-500">{vehicles.length} vehicles active</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {vehicles.map(vehicle => (
            <DeliveryVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isSelected={selectedVehicle?.id === vehicle.id}
              onSelect={onVehicleSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DeliveryVehiclesPanel;
