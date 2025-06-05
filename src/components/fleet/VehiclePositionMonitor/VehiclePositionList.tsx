
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VehiclePositionItem from './VehiclePositionItem';
import { Vehicle } from '@/types/vehicle';

interface VehiclePositionListProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

const VehiclePositionList: React.FC<VehiclePositionListProps> = ({ vehicles, isLoading }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Vehicle Positions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No active vehicles found</div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <VehiclePositionItem key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehiclePositionList;
