import React, { useState } from 'react';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Car, Plus, Search, Download, Edit2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import GP51VehicleImportModal from './GP51VehicleImportModal';
import VehicleEditModal from './VehicleEditModal';
import VehicleBulkOperations from './VehicleBulkOperations';
import type { VehicleData } from '@/types/vehicle';

const EnhancedVehicleManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleData | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleData[]>([]);
  const { devices: vehicles, isLoading, error, refetch } = useDeviceManagement(searchTerm);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'offline': return 'bg-gray-400';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleImportComplete = () => {
    setShowImportModal(false);
    refetch();
  };

  const handleEditVehicle = (vehicle: VehicleData) => {
    setEditingVehicle(vehicle);
    setShowEditModal(true);
  };

  const handleVehicleUpdated = () => {
    refetch();
  };

  const handleSelectVehicle = (vehicle: VehicleData, checked: boolean) => {
    setSelectedVehicles(prev => {
      if (checked) {
        return [...prev, vehicle];
      } else {
        return prev.filter(v => v.id !== vehicle.id);
      }
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && vehicles) {
      setSelectedVehicles(vehicles);
    } else {
      setSelectedVehicles([]);
    }
  };

  const isVehicleSelected = (vehicleId: string) => {
    return selectedVehicles.some(v => v.id === vehicleId);
  };

  const isAllSelected = vehicles && vehicles.length > 0 && selectedVehicles.length === vehicles.length;
  const isIndeterminate = selectedVehicles.length > 0 && selectedVehicles.length < (vehicles?.length || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vehicle data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center py-8">
          <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Error Loading Vehicles</h3>
          <p className="text-gray-500 mb-4">
            {error.message || 'Unable to load vehicle data'}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Select All Checkbox */}
          {vehicles && vehicles.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={isAllSelected}
                // @ts-ignore - indeterminate is a valid prop but not in types
                ref={(el) => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onCheckedChange={handleSelectAll}
              />
              <label className="text-sm">Select All</label>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Import from GP51
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Bulk Operations */}
      <VehicleBulkOperations
        selectedVehicles={selectedVehicles}
        onClearSelection={() => setSelectedVehicles([])}
        onOperationComplete={handleVehicleUpdated}
      />

      {/* Vehicle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles?.filter(v => v.status === 'online').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <div className="h-4 w-4 rounded-full bg-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles?.filter(v => v.status === 'offline').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles?.filter(v => v.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles && vehicles.length > 0 ? (
          vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isVehicleSelected(vehicle.id)}
                      onCheckedChange={(checked) => handleSelectVehicle(vehicle, checked as boolean)}
                    />
                    <div>
                      <CardTitle className="text-lg">{vehicle.device_name}</CardTitle>
                      <p className="text-sm text-gray-600">{vehicle.device_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(vehicle.status)}`} />
                    <Badge variant="outline" className="text-xs">
                      {getStatusText(vehicle.status)}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditVehicle(vehicle)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {vehicle.envio_users && (
                  <div className="text-sm text-gray-600">
                    Assigned to: {vehicle.envio_users.name || vehicle.envio_users.email}
                  </div>
                )}
                
                {vehicle.sim_number && (
                  <div className="text-sm text-gray-600">
                    SIM: {vehicle.sim_number}
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  Created: {new Date(vehicle.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No vehicles found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm 
                ? 'Try adjusting your search criteria' 
                : 'No vehicles are currently registered. Import vehicle data from GP51 or add vehicles manually to get started.'
              }
            </p>
            <Button 
              variant="outline"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Import from GP51
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <GP51VehicleImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      <VehicleEditModal
        vehicle={editingVehicle}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingVehicle(null);
        }}
        onVehicleUpdated={handleVehicleUpdated}
      />
    </div>
  );
};

export default EnhancedVehicleManagement;
