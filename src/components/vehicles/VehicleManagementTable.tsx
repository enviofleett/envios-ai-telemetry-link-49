
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { EnhancedVehicleCreationModal } from '@/components/vehicles/EnhancedVehicleCreationModal';
import { UserMappingDialog } from '@/components/users/UserMappingDialog';
import type { VehicleData } from '@/types/vehicle';

interface VehicleManagementTableProps {
  vehicles: VehicleData[];
  selectedVehicles: VehicleData[];
  onSelectVehicle: (vehicle: VehicleData, checked: boolean) => void;
  onEditVehicle: (vehicle: VehicleData) => void;
  availableUsers: Array<{ id: string; name: string; email: string }>;
}

export const VehicleManagementTable: React.FC<VehicleManagementTableProps> = ({
  vehicles,
  selectedVehicles,
  onSelectVehicle,
  onEditVehicle,
  availableUsers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMapUserModal, setShowMapUserModal] = useState(false);

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.device_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuccess = () => {
    setShowAddModal(false);
    setShowMapUserModal(false);
  };
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Vehicles</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setShowMapUserModal(true)}>Map User</Button>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or device ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device Name</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>{vehicle.device_name}</TableCell>
                  <TableCell>{vehicle.device_id}</TableCell>
                  <TableCell>{vehicle.user_id || 'Unassigned'}</TableCell>
                  <TableCell>{new Date(vehicle.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EnhancedVehicleCreationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
        availableUsers={availableUsers}
      />
      <UserMappingDialog
        open={showMapUserModal}
        onOpenChange={setShowMapUserModal}
        vehicles={vehicles}
        onMappingSuccess={handleSuccess}
      />
    </>
  );
};
