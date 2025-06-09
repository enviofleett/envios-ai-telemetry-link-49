import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import VehicleListPanel from './VehicleListPanel';
import VehicleInfoPanel from './VehicleInfoPanel';
import MapTilerMap from '@/components/map/MapTilerMap';
import { mapTilerService } from '@/services/mapTiler/mapTilerService';
import { useToast } from '@/hooks/use-toast';
import type { Vehicle } from '@/services/unifiedVehicleData';

interface LiveMapAndVehicleListProps {
  vehicles: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onTripHistory?: (vehicle: Vehicle) => void;
  onSendAlert?: (vehicle: Vehicle) => void;
}

const LiveMapAndVehicleList: React.FC<LiveMapAndVehicleListProps> = ({
  vehicles,
  onVehicleSelect,
  onTripHistory,
  onSendAlert
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'moving' | 'online' | 'offline'>('all');
  const [vehicleAddresses, setVehicleAddresses] = useState<Map<string, string>>(new Map());
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const { toast } = useToast();

  const getVehicleStatus = (vehicle: Vehicle) => {
    if (!vehicle.lastPosition?.updatetime) return 'offline';
    
    const lastUpdate = new Date(vehicle.lastPosition.updatetime);
    const now = new Date();
    const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (minutesSinceUpdate > 5) return 'offline';
    if (vehicle.lastPosition.speed > 0) return 'moving';
    return 'online';
  };

  // Filter vehicles based on search and status
  const filteredVehicles = vehicles.filter(vehicle => {
    const plateNumber = vehicle.plateNumber || vehicle.devicename;
    const matchesSearch = vehicle.devicename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vehicle.deviceid.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plateNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const vehicleStatus = getVehicleStatus(vehicle);
    return matchesSearch && vehicleStatus === statusFilter;
  });

  // Load addresses for vehicles with positions
  const loadAddresses = async (forceRefresh = false) => {
    if (vehicles.length === 0) return;
    
    setIsLoadingAddresses(true);
    const newAddresses = new Map(forceRefresh ? new Map() : vehicleAddresses);
    let loadedCount = 0;
    
    try {
      for (const vehicle of vehicles) {
        if (vehicle.lastPosition?.lat && vehicle.lastPosition?.lon) {
          const key = vehicle.deviceid;
          if (!newAddresses.has(key) || forceRefresh) {
            try {
              const address = await mapTilerService.reverseGeocode(
                vehicle.lastPosition.lat,
                vehicle.lastPosition.lon
              );
              newAddresses.set(key, address);
              loadedCount++;
            } catch (error) {
              console.error('Failed to get address for vehicle:', vehicle.deviceid, error);
              // Keep existing address if refresh fails
              if (!forceRefresh && vehicleAddresses.has(key)) {
                newAddresses.set(key, vehicleAddresses.get(key)!);
              }
            }
          }
        }
      }
      
      setVehicleAddresses(newAddresses);
      
      if (forceRefresh && loadedCount > 0) {
        toast({
          title: "Addresses refreshed",
          description: `Updated ${loadedCount} vehicle addresses`
        });
      }
    } catch (error) {
      console.error('Address loading error:', error);
      toast({
        title: "Address loading failed",
        description: "Some addresses could not be loaded",
        variant: "destructive"
      });
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [vehicles]);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    onVehicleSelect?.(vehicle);
  };

  const handleRefreshAddresses = () => {
    loadAddresses(true);
  };

  const handleExport = () => {
    console.log('Export clicked');
    // TODO: Implement export functionality
  };

  const selectedVehicleAddress = selectedVehicle 
    ? vehicleAddresses.get(selectedVehicle.deviceid) || 'Loading address...'
    : '';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-10 gap-6">
        {/* Map Section - 70% width (7/10 columns) */}
        <div className="col-span-7">
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
                    onValueChange={(value: 'all' | 'moving' | 'online' | 'offline') => setStatusFilter(value)}
                  >
                    <SelectTrigger className="h-10 border-gray-lighter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-lighter">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="moving">Moving</SelectItem>
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
              <MapTilerMap
                vehicles={filteredVehicles}
                height="400px"
                onVehicleSelect={handleVehicleSelect}
                selectedVehicle={selectedVehicle}
                defaultZoom={12}
                showControls={true}
                className="rounded-b-lg"
              />
            </CardContent>
          </Card>
        </div>

        {/* Vehicle List Panel - 30% width (3/10 columns) */}
        <div className="col-span-3">
          <VehicleListPanel
            vehicles={filteredVehicles}
            onVehicleSelect={handleVehicleSelect}
            onTripHistory={onTripHistory}
            onSendAlert={onSendAlert}
            vehicleAddresses={vehicleAddresses}
            selectedVehicle={selectedVehicle}
            onRefreshAddresses={handleRefreshAddresses}
          />
        </div>
      </div>

      {/* Vehicle Info Panel - Below the map */}
      <div className="grid grid-cols-10 gap-6">
        <div className="col-span-7">
          <VehicleInfoPanel 
            vehicle={selectedVehicle} 
            address={selectedVehicleAddress}
          />
        </div>
        <div className="col-span-3">
          {/* Empty space to align with the right panel */}
        </div>
      </div>
    </div>
  );
};

export default LiveMapAndVehicleList;
