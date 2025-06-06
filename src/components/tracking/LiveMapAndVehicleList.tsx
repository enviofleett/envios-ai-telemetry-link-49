
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import EnhancedMapTilerMap from '@/components/map/EnhancedMapTilerMap';
import VehicleListPanel from './VehicleListPanel';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface LiveMapAndVehicleListProps {
  vehicles: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
}

const LiveMapAndVehicleList: React.FC<LiveMapAndVehicleListProps> = ({
  vehicles,
  onVehicleSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate <= 5) return 'online';
    return 'offline';
  };

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.devicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.deviceid.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const vehicleStatus = getVehicleStatus(vehicle);
    return matchesSearch && vehicleStatus === statusFilter;
  });

  const handleExport = () => {
    console.log('Export clicked');
    // TODO: Implement export functionality
  };

  const handleVehicleMapSelect = (vehicle: Vehicle) => {
    console.log('Vehicle selected on map:', vehicle);
    onVehicleSelect?.(vehicle);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map Card - 2/3 width */}
      <div className="lg:col-span-2">
        <Card className="bg-white border border-gray-lighter shadow-sm">
          <CardHeader className="p-6 border-b border-gray-lighter">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-primary-dark">
                Live Vehicle Map
              </CardTitle>
            </div>
            
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mt-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-mid" />
                  <Input
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 border-gray-lighter"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <Select 
                  value={statusFilter} 
                  onValueChange={(value: 'all' | 'online' | 'offline') => setStatusFilter(value)}
                >
                  <SelectTrigger className="h-10 border-gray-lighter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-lighter">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                onClick={handleExport}
                className="bg-white border-gray-lighter text-primary-dark hover:bg-gray-background"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="h-96 bg-gray-background rounded-b-lg">
              <EnhancedMapTilerMap
                vehicles={filteredVehicles}
                onVehicleSelect={handleVehicleMapSelect}
                height="400px"
                className="rounded-b-lg border-0"
                enableClustering={true}
                enableGeofencing={false}
                maxVehiclesBeforeClustering={100}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List Panel - 1/3 width */}
      <div className="lg:col-span-1">
        <VehicleListPanel
          vehicles={filteredVehicles}
          onVehicleSelect={onVehicleSelect}
        />
      </div>
    </div>
  );
};

export default LiveMapAndVehicleList;
