
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { VehicleData } from '@/types/vehicle';
import DeliveryOrderCard from './DeliveryOrderCard';

interface ActiveDeliveriesPanelProps {
  vehicle: VehicleData | null;
}

const ActiveDeliveriesPanel: React.FC<ActiveDeliveriesPanelProps> = ({ vehicle }) => {
  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center text-gray-500">
          <p>Select a vehicle to see delivery details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Active Deliveries for {vehicle.driver?.name}</h2>
        <p className="text-sm text-gray-500">{vehicle.deliveries?.length || 0} orders in queue</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {vehicle.deliveries && vehicle.deliveries.length > 0 ? (
            vehicle.deliveries.map(order => (
              <DeliveryOrderCard key={order.id} order={order} />
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No active deliveries for this vehicle.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActiveDeliveriesPanel;
