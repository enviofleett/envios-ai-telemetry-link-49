
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, Users, Car, Check, X } from 'lucide-react';

interface Vehicle {
  id: string;
  gp51_device_id: string;
  name: string;
  sim_number?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  envio_users?: {
    id: string;
    name: string;
    email: string;
  };
}

interface EnvioUser {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  city?: string;
}

const VehicleAssignmentTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set());
  const [bulkAssignmentMode, setBulkAssignmentMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vehicles
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['admin-vehicles', searchQuery],
    queryFn: async (): Promise<Vehicle[]> => {
      let query = supabase
        .from('vehicles')
        .select(`
          id,
          gp51_device_id,
          name,
          sim_number,
          user_id,
          created_at,
          updated_at,
          envio_users (
            id,
            name,
            email
          )
        `)
        .order('name', { ascending: true });

      if (searchQuery) {
        query = query.or(`gp51_device_id.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['envio-users'],
    queryFn: async (): Promise<EnvioUser[]> => {
      const { data, error } = await supabase
        .from('envio_users')
        .select('id, name, email, phone_number, city')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Single vehicle assignment mutation
  const assignVehicleMutation = useMutation({
    mutationFn: async ({ vehicleId, userId }: { vehicleId: string; userId: string | null }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: userId })
        .eq('id', vehicleId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      toast({
        title: "Assignment Updated",
        description: "Vehicle assignment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Assignment Failed",
        description: `Failed to update vehicle assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Bulk assignment mutation
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ vehicleIds, userId }: { vehicleIds: string[]; userId: string | null }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: userId })
        .in('id', vehicleIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      setSelectedVehicles(new Set());
      setBulkAssignmentMode(false);
      toast({
        title: "Bulk Assignment Complete",
        description: `Successfully updated assignments for ${selectedVehicles.size} vehicles.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Bulk Assignment Failed",
        description: `Failed to update vehicle assignments: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSingleAssignment = (vehicleId: string, userId: string) => {
    assignVehicleMutation.mutate({ vehicleId, userId: userId || null });
  };

  const handleBulkAssignment = () => {
    if (selectedVehicles.size === 0) {
      toast({
        title: "No Vehicles Selected",
        description: "Please select at least one vehicle for bulk assignment.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUser) {
      toast({
        title: "No User Selected",
        description: "Please select a user for bulk assignment.",
        variant: "destructive",
      });
      return;
    }

    bulkAssignMutation.mutate({
      vehicleIds: Array.from(selectedVehicles),
      userId: selectedUser,
    });
  };

  const handleUnassignVehicle = (vehicleId: string) => {
    assignVehicleMutation.mutate({ vehicleId, userId: null });
  };

  const handleVehicleSelection = (vehicleId: string, checked: boolean) => {
    const newSelection = new Set(selectedVehicles);
    if (checked) {
      newSelection.add(vehicleId);
    } else {
      newSelection.delete(vehicleId);
    }
    setSelectedVehicles(newSelection);
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.gp51_device_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unassignedVehicles = filteredVehicles.filter(v => !v.user_id);
  const assignedVehicles = filteredVehicles.filter(v => v.user_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vehicle Assignment</h2>
          <p className="text-muted-foreground">
            Assign vehicles to users and manage bulk assignments
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={bulkAssignmentMode ? "default" : "outline"}
            onClick={() => setBulkAssignmentMode(!bulkAssignmentMode)}
          >
            <Users className="h-4 w-4 mr-2" />
            {bulkAssignmentMode ? 'Exit Bulk Mode' : 'Bulk Assignment'}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Vehicles</Label>
              <Input
                id="search"
                placeholder="Search by device ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Bulk Assignment Controls */}
          {bulkAssignmentMode && (
            <div className="border-t pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="bulk-user">Assign Selected Vehicles To</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassign</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 items-end">
                  <Button
                    onClick={handleBulkAssignment}
                    disabled={selectedVehicles.size === 0 || bulkAssignMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign {selectedVehicles.size} Vehicle{selectedVehicles.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredVehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{assignedVehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Unassigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{unassignedVehicles.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicles
            {bulkAssignmentMode && selectedVehicles.size > 0 && (
              <Badge variant="secondary">
                {selectedVehicles.size} selected
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {bulkAssignmentMode ? 'Select vehicles for bulk assignment' : 'Manage individual vehicle assignments'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehiclesLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading vehicles...</p>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No vehicles found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`border rounded-lg p-4 ${
                    selectedVehicles.has(vehicle.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {bulkAssignmentMode && (
                        <Checkbox
                          checked={selectedVehicles.has(vehicle.id)}
                          onCheckedChange={(checked) =>
                            handleVehicleSelection(vehicle.id, checked as boolean)
                          }
                        />
                      )}
                      <div>
                        <h4 className="font-semibold">{vehicle.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.gp51_device_id}
                          {vehicle.sim_number && ` • SIM: ${vehicle.sim_number}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {vehicle.envio_users ? (
                        <div className="text-right">
                          <Badge variant="default">Assigned</Badge>
                          <p className="text-sm text-muted-foreground mt-1">
                            {vehicle.envio_users.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vehicle.envio_users.email}
                          </p>
                        </div>
                      ) : (
                        <Badge variant="secondary">Unassigned</Badge>
                      )}

                      {!bulkAssignmentMode && (
                        <div className="flex gap-2">
                          {vehicle.envio_users ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnassignVehicle(vehicle.id)}
                              disabled={assignVehicleMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Select
                              value=""
                              onValueChange={(userId) => handleSingleAssignment(vehicle.id, userId)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Assign to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleAssignmentTab;
