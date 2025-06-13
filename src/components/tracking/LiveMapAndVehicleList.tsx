
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Map, List } from 'lucide-react';
import MapTilerMap from '@/components/map/MapTilerMap';
import CompactVehicleCard from './CompactVehicleCard';
import { useStableVehicleData } from '@/hooks/useStableVehicleData';
import type { VehicleData } from '@/types/vehicle';

interface LiveMapAndVehicleListProps {
  selectedVehicle?: VehicleData | null;
  onVehicleSelect?: (vehicle: VehicleData) => void;
}

const LiveMapAndVehicleList: React.FC<LiveMapAndVehicleListProps> = ({
  selectedVehicle = null,
  onVehicleSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showMap, setShowMap] = useState(true);

  // Use stable vehicle data with filters - fixed to use correct options
  const { vehicles } = useStableVehicleData({ search: searchTerm });

  const handleVehicleSelect = (vehicle: VehicleData) => {
    onVehicleSelect?.(vehicle);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Left Panel: Map or Toggle */}
      <div className="lg:w-3/4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <Input
                type="search"
                placeholder="Search vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? (
                  <>
                    <List className="w-4 h-4 mr-2" />
                    Show List
                  </>
                ) : (
                  <>
                    <Map className="w-4 h-4 mr-2" />
                    Show Map
                  </>
                )}
              </Button>
            </div>

            {showMap ? (
              <MapTilerMap
                vehicles={vehicles}
                selectedVehicle={selectedVehicle}
                onVehicleSelect={handleVehicleSelect}
                height="400px"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((vehicle) => (
                  <CompactVehicleCard
                    key={vehicle.device_id}
                    vehicle={vehicle}
                    onClick={handleVehicleSelect}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Vehicle List */}
      <div className="lg:w-1/4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Vehicle List</h3>
            <div className="space-y-2">
              {vehicles.map((vehicle) => (
                <Button
                  key={vehicle.device_id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  {vehicle.device_name || vehicle.device_id}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LiveMapAndVehicleList;
