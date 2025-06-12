
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  User, 
  MapPin, 
  Clock, 
  Zap,
  Activity,
  UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VehicleUserAssignmentModal } from '@/components/admin/VehicleUserAssignmentModal';
import { useToast } from '@/hooks/use-toast';

interface Vehicle {
  id: string;
  device_id: string;
  device_name: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  license_plate?: string | null;
  is_active: boolean;
  envio_user_id?: string | null;
  gp51_metadata?: any;
  created_at: string;
  updated_at: string;
  user_name?: string | null;
  user_email?: string | null;
}

interface VehicleQueryResult {
  id: string;
  device_id: string;
  device_name: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  color?: string | null;
  license_plate?: string | null;
  is_active: boolean;
  envio_user_id?: string | null;
  gp51_metadata?: any;
  created_at: string;
  updated_at: string;
  envio_users?: {
    name: string;
    email: string;
  } | null;
}

export const VehicleManagementTable: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    const filtered = vehicles.filter(vehicle =>
      vehicle.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vehicle.user_name && vehicle.user_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.make && vehicle.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.model && vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (vehicle.license_plate && vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredVehicles(filtered);
  }, [vehicles, searchTerm]);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          id,
          device_id,
          device_name,
          make,
          model,
          year,
          color,
          license_plate,
          is_active,
          envio_user_id,
          gp51_metadata,
          created_at,
          updated_at,
          envio_users (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching vehicles:', error);
        toast({
          title: "Error",
          description: "Failed to fetch vehicles",
          variant: "destructive"
        });
        setVehicles([]);
        return;
      }

      // Safely process the data
      const processedVehicles: Vehicle[] = (data || []).map((vehicleData: VehicleQueryResult) => ({
        id: vehicleData.id,
        device_id: vehicleData.device_id,
        device_name: vehicleData.device_name,
        make: vehicleData.make,
        model: vehicleData.model,
        year: vehicleData.year,
        color: vehicleData.color,
        license_plate: vehicleData.license_plate,
        is_active: vehicleData.is_active,
        envio_user_id: vehicleData.envio_user_id,
        gp51_metadata: vehicleData.gp51_metadata,
        created_at: vehicleData.created_at,
        updated_at: vehicleData.updated_at,
        user_name: vehicleData.envio_users?.name || null,
        user_email: vehicleData.envio_users?.email || null
      }));

      setVehicles(processedVehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch vehicles",
        variant: "destructive"
      });
      setVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const openAssignmentModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsAssignmentModalOpen(true);
  };

  const closeAssignmentModal = () => {
    setSelectedVehicle(null);
    setIsAssignmentModalOpen(false);
  };

  const handleAssignmentComplete = () => {
    fetchVehicles(); // Refresh the table
  };

  const getVehicleStatusBadge = (vehicle: Vehicle) => {
    if (vehicle.gp51_metadata) {
      const metadata = vehicle.gp51_metadata;
      const lastUpdate = new Date(metadata.timestamp);
      const isRecent = Date.now() - lastUpdate.getTime() < (30 * 60 * 1000); // 30 minutes
      
      if (isRecent && vehicle.is_active) {
        return <Badge variant="default" className="bg-green-500">Live</Badge>;
      } else if (vehicle.is_active) {
        return <Badge variant="secondary">Active</Badge>;
      } else {
        return <Badge variant="outline">Offline</Badge>;
      }
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getVehicleSource = (vehicle: Vehicle) => {
    if (vehicle.gp51_metadata) {
      return (
        <Badge variant="outline" className="text-blue-600 border-blue-200">
          <Zap className="w-3 h-3 mr-1" />
          GP51
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-600">
        Manual
      </Badge>
    );
  };

  const formatLastUpdate = (vehicle: Vehicle) => {
    if (vehicle.gp51_metadata?.timestamp) {
      const lastUpdate = new Date(vehicle.gp51_metadata.timestamp);
      return lastUpdate.toLocaleString();
    }
    return new Date(vehicle.updated_at).toLocaleString();
  };

  const getLocationInfo = (vehicle: Vehicle) => {
    if (vehicle.gp51_metadata?.latitude && vehicle.gp51_metadata?.longitude) {
      return `${vehicle.gp51_metadata.latitude.toFixed(4)}, ${vehicle.gp51_metadata.longitude.toFixed(4)}`;
    }
    return 'No location data';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Vehicle Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles by device ID, name, user, or license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={fetchVehicles} variant="outline">
              Refresh
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{vehicles.length}</div>
              <div className="text-sm text-blue-800">Total Vehicles</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {vehicles.filter(v => v.gp51_metadata).length}
              </div>
              <div className="text-sm text-green-800">GP51 Imported</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {vehicles.filter(v => v.envio_user_id).length}
              </div>
              <div className="text-sm text-purple-800">Assigned to Users</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {vehicles.filter(v => v.is_active).length}
              </div>
              <div className="text-sm text-orange-800">Active Vehicles</div>
            </div>
          </div>

          {/* Vehicle Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Info</TableHead>
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Assigned User</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      Loading vehicles...
                    </TableCell>
                  </TableRow>
                ) : filteredVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-6">
                      {searchTerm ? 'No vehicles found matching your search' : 'No vehicles found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{vehicle.device_id}</div>
                          <div className="text-sm text-muted-foreground">{vehicle.device_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {vehicle.make || vehicle.model ? (
                            <div className="font-medium">
                              {vehicle.make} {vehicle.model} {vehicle.year}
                            </div>
                          ) : (
                            <div className="text-muted-foreground">No vehicle details</div>
                          )}
                          {vehicle.license_plate && (
                            <div className="text-sm text-muted-foreground">{vehicle.license_plate}</div>
                          )}
                          {vehicle.color && (
                            <Badge variant="outline" className="text-xs">{vehicle.color}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getVehicleStatusBadge(vehicle)}
                      </TableCell>
                      <TableCell>
                        {getVehicleSource(vehicle)}
                      </TableCell>
                      <TableCell>
                        {vehicle.user_name ? (
                          <div className="space-y-1">
                            <div className="font-medium">{vehicle.user_name}</div>
                            <div className="text-sm text-muted-foreground">{vehicle.user_email}</div>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">Unassigned</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {getLocationInfo(vehicle)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLastUpdate(vehicle)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAssignmentModal(vehicle)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          {vehicle.user_name ? 'Reassign' : 'Assign'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Assignment Modal */}
      {selectedVehicle && (
        <VehicleUserAssignmentModal
          isOpen={isAssignmentModalOpen}
          onClose={closeAssignmentModal}
          vehicleId={selectedVehicle.id}
          vehicleDeviceId={selectedVehicle.device_id}
          currentUserId={selectedVehicle.envio_user_id}
          currentUserName={selectedVehicle.user_name}
          onAssignmentComplete={handleAssignmentComplete}
        />
      )}
    </div>
  );
};
