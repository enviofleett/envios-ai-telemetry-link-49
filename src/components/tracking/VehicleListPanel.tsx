
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CompactVehicleCard from './CompactVehicleCard';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface VehicleListPanelProps {
  vehicles: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

const VehicleListPanel: React.FC<VehicleListPanelProps> = ({
  vehicles,
  onVehicleSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.devicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.deviceid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTripClick = (vehicle: Vehicle) => {
    console.log('Trip clicked for vehicle:', vehicle.deviceid);
    // TODO: Implement trip functionality
  };

  const handleAlertClick = (vehicle: Vehicle) => {
    console.log('Alert clicked for vehicle:', vehicle.deviceid);
    // TODO: Implement alert functionality
  };

  return (
    <div className="bg-white border border-gray-lighter rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-primary-dark mb-4">Vehicle List</h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-mid" />
          <Input
            placeholder="Search vehicles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 border-gray-lighter"
          />
        </div>
      </div>

      {/* Vehicle List */}
      <div className="space-y-0 max-h-96 overflow-y-auto">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map((vehicle) => (
            <CompactVehicleCard
              key={vehicle.deviceid}
              vehicle={vehicle}
              onTripClick={handleTripClick}
              onAlertClick={handleAlertClick}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-mid">
            {searchTerm ? 'No vehicles found matching your search' : 'No vehicles available'}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleListPanel;
