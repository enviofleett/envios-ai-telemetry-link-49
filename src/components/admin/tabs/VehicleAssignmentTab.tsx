
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Car, User, Search, Users, MapPin } from 'lucide-react';

interface Vehicle {
  id: string;
  gp51_device_id: string;
  name: string;
  user_id: string | null;
  last_position: any;
  created_at: string;
  updated_at: string;
}

interface EnvioUser {
  id: string;
  name: string;
  email: string;
}

const VehicleAssignmentTab: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<EnvioUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .order('name');

      if (vehiclesError) {
        console.error('Error loading vehicles:', vehiclesError);
        toast({
          title: "Error",
          description: "Failed to load vehicles",
          variant: "destructive"
        });
        return;
      }

      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .order('name');

      if (usersError) {
        console.error('Error loading users:', usersError);
        toast({
          title: "Error", 
          description: "Failed to load users",
          variant: "destructive"
        });
        return;
      }

      setVehicles(vehiclesData || []);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignVehicle = async (vehicleId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq('id', vehicleId);

      if (error) {
        console.error('Error assigning vehicle:', error);
        toast({
          title: "Error",
          description: "Failed to assign vehicle",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setVehicles(prev => prev.map(vehicle => 
        vehicle.id === vehicleId 
          ? { ...vehicle, user_id: userId, updated_at: new Date().toISOString() }
          : vehicle
      ));

      const user = users.find(u => u.id === userId);
      toast({
        title: "Success",
        description: userId 
          ? `Vehicle assigned to ${user?.name || 'user'}` 
          : "Vehicle unassigned"
      });
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast({
        title: "Error",
        description: "Failed to assign vehicle",
        variant: "destructive"
      });
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = !searchTerm || 
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.gp51_device_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = !selectedUser || vehicle.user_id === selectedUser;
    
    return matchesSearch && matchesUser;
  });

  const getAssignedUser = (userId: string | null) => {
    if (!userId) return null;
    return users.find(user => user.id === userId);
  };

  const getVehicleStatusBadge = (vehicle: Vehicle) => {
    if (!vehicle.last_position) {
      return <Badge variant="secondary">No Position</Badge>;
    }
    
    const lastUpdate = new Date(vehicle.last_position.timestamp || vehicle.updated_at);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate < 1) {
      return <Badge variant="default">Online</Badge>;
    } else if (hoursSinceUpdate < 24) {
      return <Badge variant="outline">Recent</Badge>;
    } else {
      return <Badge variant="secondary">Offline</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vehicles and users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles.filter(v => v.user_id).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles.filter(v => !v.user_id).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Assignment Management</CardTitle>
          <CardDescription>
            Assign vehicles to users and manage vehicle-user relationships
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vehicles by name or device ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Users</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <div className="grid gap-4">
        {filteredVehicles.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
                <p className="text-muted-foreground">
                  {vehicles.length === 0 
                    ? "No vehicles have been synced from GP51 yet. Run a data sync first."
                    : "No vehicles match your current filters."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredVehicles.map(vehicle => {
            const assignedUser = getAssignedUser(vehicle.user_id);
            
            return (
              <Card key={vehicle.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Car className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{vehicle.name}</h3>
                        {getVehicleStatusBadge(vehicle)}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Device ID: {vehicle.gp51_device_id}</p>
                        {vehicle.last_position && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {vehicle.last_position.latitude?.toFixed(6)}, {vehicle.last_position.longitude?.toFixed(6)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {assignedUser ? (
                        <div className="text-right">
                          <p className="font-medium">{assignedUser.name}</p>
                          <p className="text-sm text-muted-foreground">{assignedUser.email}</p>
                        </div>
                      ) : (
                        <Badge variant="outline">Unassigned</Badge>
                      )}
                      
                      <Select
                        value={vehicle.user_id || ""}
                        onValueChange={(value) => handleAssignVehicle(vehicle.id, value || null)}
                      >
                        <SelectTrigger className="w-full sm:w-48">
                          <SelectValue placeholder="Assign to user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassign</SelectItem>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VehicleAssignmentTab;
