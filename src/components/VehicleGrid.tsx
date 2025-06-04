
import React from 'react';
import { Car } from 'lucide-react';
import VehicleCard from './VehicleCard';

interface Vehicle {
  deviceid: string;
  devicename: string;
  status?: string;
  lastPosition?: {
    lat: number;
    lon: number;
    speed: number;
    course: number;
    updatetime: string;
    statusText: string;
  };
}

interface VehicleGridProps {
  vehicles: Vehicle[];
}

const VehicleGrid: React.FC<VehicleGridProps> = ({ vehicles }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Fleet Overview ({vehicles.length} vehicles)
        </h2>
        <p className="text-gray-600">
          Real-time monitoring of your vehicle fleet via GP51 Telemetry
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.deviceid} vehicle={vehicle} />
        ))}
      </div>

      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles found</h3>
          <p className="text-gray-600">No vehicles are currently associated with your account.</p>
        </div>
      )}
    </div>
  );
};

export default VehicleGrid;
