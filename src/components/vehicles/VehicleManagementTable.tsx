
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import type { VehicleData, VehicleDbRecord } from '@/types/vehicle';

const mapDbToDisplayVehicle = (dbVehicle: VehicleDbRecord): VehicleData => ({
  id: dbVehicle.id,
  device_id: dbVehicle.gp51_device_id,
  device_name: dbVehicle.name,
  user_id: dbVehicle.user_id,
  sim_number: dbVehicle.sim_number,
  created_at: dbVehicle.created_at,
  updated_at: dbVehicle.updated_at,
  status: 'offline', // Default value
  is_active: true, // Default value
  lastUpdate: new Date(dbVehicle.updated_at),
});

const fetchVehicles = async (searchQuery: string): Promise<VehicleData[]> => {
  let query = supabase
    .from('vehicles')
    .select('id, gp51_device_id, name, user_id, sim_number, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,gp51_device_id.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching vehicles:", error);
    // Throwing an error will be caught by react-query and set the 'error' state
    throw new Error(error.message);
  }

  if (!data) {
    return [];
  }
  const dbRecords: VehicleDbRecord[] = data;
  return dbRecords.map(mapDbToDisplayVehicle);
};

export const VehicleManagementTable: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMapUserModal, setShowMapUserModal] = useState(false);

  const { data: vehicles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['vehicles', searchQuery],
    queryFn: () => fetchVehicles(searchQuery)
  });

  const handleSuccess = () => {
    refetch();
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
          {isLoading ? (
            <p>Loading vehicles...</p>
          ) : error ? (
            <p className="text-red-500">Failed to load vehicles. Please try again later.</p>
          ) : (
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
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.device_name}</TableCell>
                    <TableCell>{vehicle.device_id}</TableCell>
                    <TableCell>{vehicle.user_id || 'Unassigned'}</TableCell>
                    <TableCell>{new Date(vehicle.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <EnhancedVehicleCreationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleSuccess}
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
