
import React, { useState } from 'react';
import DeliveryTrackingMap from '@/components/delivery/DeliveryTrackingMap';
import DeliveryVehiclesPanel from '@/components/delivery/DeliveryVehiclesPanel';
import ActiveDeliveriesPanel from '@/components/delivery/ActiveDeliveriesPanel';
import { useEnhancedVehicleData } from '@/hooks/useEnhancedVehicleData';
import type { VehicleData, DeliveryOrder } from '@/types/vehicle';
import { AlertTriangle, Loader2 } from 'lucide-react';

const LiveTracking: React.FC = () => {
  const { vehicles, isLoading, metrics } = useEnhancedVehicleData();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  // NOTE: This is temporary mock data to demonstrate the UI.
  // In a real application, this would come from your backend.
  const vehiclesWithDeliveries: VehicleData[] = vehicles.map((v, index) => ({
    ...v,
    driver: {
      name: v.device_name || `Driver ${index + 1}`,
      avatarUrl: `https://i.pravatar.cc/48?u=${v.device_id}`,
    },
    deliveryStatus: index % 3 === 0 ? 'delivering' : (index % 3 === 1 ? 'available' : 'offline'),
    deliveries: index % 3 === 0 ? [
      {
        id: `order-${v.device_id}-1`,
        customerName: 'John Doe',
        customerAddress: '123 Main St, Anytown, USA',
        customerPhone: '555-1234',
        status: 'in_transit' as DeliveryOrder['status'],
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
        items: [{ name: 'Large Pizza', quantity: 1 }],
      },
      {
        id: `order-${v.device_id}-2`,
        customerName: 'Jane Smith',
        customerAddress: '456 Oak Ave, Anytown, USA',
        customerPhone: '555-5678',
        status: 'pending' as DeliveryOrder['status'],
        estimatedDeliveryTime: new Date(Date.now() + 60 * 60000).toISOString(),
        items: [{ name: 'Gadget Pro', quantity: 2 }],
      },
    ] : [],
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading Tracking Data...</p>
      </div>
    );
  }

  if (metrics.syncStatus === 'error') {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        <AlertTriangle className="w-8 h-8 mr-2" />
        <p>Error loading tracking data: {metrics.errorMessage || 'Sync failed'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      <div className="flex-grow-[3] h-0"> {/* 60% height */}
        <DeliveryTrackingMap vehicles={vehiclesWithDeliveries} selectedVehicle={selectedVehicle} onVehicleSelect={setSelectedVehicle} />
      </div>
      <div className="flex flex-grow-[2] h-0 border-t border-gray-200"> {/* 40% height */}
        <div className="w-[30%] border-r border-gray-200">
          <DeliveryVehiclesPanel vehicles={vehiclesWithDeliveries} selectedVehicle={selectedVehicle} onVehicleSelect={setSelectedVehicle} />
        </div>
        <div className="w-[70%]">
          <ActiveDeliveriesPanel vehicle={selectedVehicle} />
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
