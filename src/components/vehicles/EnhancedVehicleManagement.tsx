
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useStableEnhancedVehicleData } from '@/hooks/useStableEnhancedVehicleData';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Search, Plus, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import VehicleEditModal from './VehicleEditModal';
import VehicleBulkOperations from './VehicleBulkOperations';
import type { VehicleData } from '@/types/vehicle';

interface User {
  id: string;
  name: string;
  email: string;
}

const EnhancedVehicleManagement: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleData[]>([]);
  const [editingVehicle, setEditingVehicle] = useState<VehicleData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const {
    vehicles,
    isLoading,
    error,
    refetch
  } = useStableEnhancedVehicleData();

  const {
    users,
    isLoading: usersLoading
  } = useUserProfiles();

  const availableUsers: User[] = users?.map(user => ({
    id: user.id,
    name: user.name || user.email || 'Unknown',
    email: user.email || ''
  })) || [];

  const filteredVehicles = vehicles?.filter(vehicle =>
    vehicle.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.device_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.envio_users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.envio_users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Selection state management
  const isAllSelected = filteredVehicles.length > 0 && selectedVehicles.length === filteredVehicles.length;
  const isIndeterminate = selectedVehicles.length > 0 && selectedVehicles.length < filteredVehicles.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles([...filteredVehicles]);
    }
  };

  const handleSelectVehicle = (vehicle: VehicleData) => {
    setSelectedVehicles(prev => {
      const isSelected = prev.some(v => v.id === vehicle.id);
      if (isSelected) {
        return prev.filter(v => v.id !== vehicle.id);
      } else {
        return [...prev, vehicle];
      }
    });
  };

  const handleEdit = (vehicle: VehicleData) => {
    setEditingVehicle(vehicle);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditingVehicle(null);
    setIsEditModalOpen(false);
  };

  const handleVehicleUpdated = () => {
    refetch();
    toast({
      title: "Success",
      description: "Vehicle updated successfully",
    });
  };

  const handleBulkOperationComplete = () => {
    refetch();
    setSelectedVehicles([]);
  };

  const getCheckboxState = () => {
    if (isAllSelected) return true;
    if (isIndeterminate) return "indeterminate";
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading vehicles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error loading vehicles: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Management</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Vehicle
            </Button>
          </div>

          {/* Bulk Operations */}
          <VehicleBulkOperations
            selectedVehicles={selectedVehicles}
            onClearSelection={() => setSelectedVehicles([])}
            onOperationComplete={handleBulkOperationComplete}
            availableUsers={availableUsers}
          />

          {/* Vehicles Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={getCheckboxState()}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Vehicle Name</TableHead>
                  <TableHead>Assigned User</TableHead>
                  <TableHead>SIM Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedVehicles.some(v => v.id === vehicle.id)}
                        onCheckedChange={() => handleSelectVehicle(vehicle)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {vehicle.device_id || 'N/A'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {vehicle.device_name || 'Unnamed Vehicle'}
                    </TableCell>
                    <TableCell>
                      {vehicle.envio_users ? (
                        <div>
                          <div className="font-medium">{vehicle.envio_users.name}</div>
                          <div className="text-sm text-gray-500">{vehicle.envio_users.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.sim_number ? (
                        <span className="font-mono text-sm">{vehicle.sim_number}</span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={vehicle.status === 'active' ? 'default' : 'secondary'}
                      >
                        {vehicle.status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {vehicle.updated_at ? new Date(vehicle.updated_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No vehicles found matching your search.' : 'No vehicles found.'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <VehicleEditModal
        vehicle={editingVehicle}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onVehicleUpdated={handleVehicleUpdated}
        availableUsers={availableUsers}
      />
    </div>
  );
};

export default EnhancedVehicleManagement;
