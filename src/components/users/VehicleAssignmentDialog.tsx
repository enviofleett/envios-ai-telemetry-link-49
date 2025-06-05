import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Car, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  name: string;
  email: string;
  gp51_username?: string;
}

// Type for the raw vehicle data from Supabase
interface RawVehicleData {
  id: string;
  device_id: string;
  device_name: string;
  status?: string;
  sim_number?: string;
  notes?: string;
  is_active: boolean;
  last_position?: any;
  envio_user_id?: string;
  gp51_metadata?: any;
  created_at: string;
  updated_at: string;
}

// Simplified Vehicle type for this component
interface Vehicle {
  id: string;
  device_id: string;
  device_name: string;
  status?: string;
  envio_user_id?: string;
}

interface VehicleAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const VehicleAssignmentDialog: React.FC<VehicleAssignmentDialogProps> = ({
  open,
  onOpenChange,
  user
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [assignedVehicles, setAssignedVehicles] = useState<string[]>([]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all vehicles
  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('device_name');
      
      if (error) throw error;
      
      // Transform the raw data to our Vehicle interface
      return (data as RawVehicleData[]).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.device_id,
        device_name: vehicle.device_name,
        status: vehicle.status,
        envio_user_id: vehicle.envio_user_id
      })) as Vehicle[];
    },
    enabled: open
  });

  // Fetch current user's vehicle assignments
  const { data: currentAssignments } = useQuery({
    queryKey: ['user-vehicle-assignments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('vehicles')
        .select('device_id')
        .eq('envio_user_id', user.id);
      
      if (error) throw error;
      return data.map(v => v.device_id);
    },
    enabled: open && !!user?.id
  });

  // Initialize assigned vehicles when data loads
  React.useEffect(() => {
    if (currentAssignments) {
      setAssignedVehicles(currentAssignments);
      setSelectedVehicles([]);
    }
  }, [currentAssignments]);

  const assignVehiclesMutation = useMutation({
    mutationFn: async (vehicleIds: string[]) => {
      if (!user?.id) throw new Error('No user selected');

      // Update vehicles to assign to this user
      const { error: assignError } = await supabase
        .from('vehicles')
        .update({ envio_user_id: user.id })
        .in('device_id', vehicleIds);

      if (assignError) throw assignError;

      // Remove assignment from vehicles not in the list
      const { error: unassignError } = await supabase
        .from('vehicles')
        .update({ envio_user_id: null })
        .eq('envio_user_id', user.id)
        .not('device_id', 'in', `(${vehicleIds.map(id => `"${id}"`).join(',')})`);

      if (unassignError) throw unassignError;

      return vehicleIds;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-for-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['user-vehicle-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['users-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['users-enhanced'] });
      onOpenChange(false);
      toast({ 
        title: 'Vehicle assignments updated',
        description: `${assignedVehicles.length} vehicles assigned to ${user?.name}`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating vehicle assignments',
        description: error.message,
        variant: 'destructive'
      });
    },
  });

  const handleVehicleToggle = (vehicleId: string, checked: boolean) => {
    if (checked) {
      setAssignedVehicles([...assignedVehicles, vehicleId]);
    } else {
      setAssignedVehicles(assignedVehicles.filter(id => id !== vehicleId));
    }
  };

  const handleSave = () => {
    assignVehiclesMutation.mutate(assignedVehicles);
  };

  const filteredVehicles = vehicles?.filter(vehicle =>
    vehicle.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.device_id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const availableVehicles = filteredVehicles.filter(v => !v.envio_user_id || v.envio_user_id === user?.id);
  const assignedCount = assignedVehicles.length;
  const totalAvailable = availableVehicles.length;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Vehicles to {user.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search and Summary */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {assignedCount} of {totalAvailable} assigned
              </Badge>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="border rounded-lg overflow-hidden flex-1">
            <div className="max-h-96 overflow-y-auto">
              {vehiclesLoading ? (
                <div className="p-4 text-center">Loading vehicles...</div>
              ) : availableVehicles.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No vehicles found matching your search' : 'No vehicles available'}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {availableVehicles.map((vehicle) => (
                    <div
                      key={vehicle.device_id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border"
                    >
                      <Checkbox
                        checked={assignedVehicles.includes(vehicle.device_id)}
                        onCheckedChange={(checked) => 
                          handleVehicleToggle(vehicle.device_id, checked as boolean)
                        }
                      />
                      <Car className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium">{vehicle.device_name}</div>
                        <div className="text-sm text-gray-500">ID: {vehicle.device_id}</div>
                      </div>
                      <div className="flex gap-2">
                        {vehicle.status && (
                          <Badge variant="outline" className="text-xs">
                            {vehicle.status}
                          </Badge>
                        )}
                        {vehicle.envio_user_id === user.id && (
                          <Badge variant="default" className="text-xs">
                            Currently Assigned
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {availableVehicles.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignedVehicles(availableVehicles.map(v => v.device_id))}
              >
                <Plus className="h-4 w-4 mr-1" />
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignedVehicles([])}
              >
                <Minus className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={assignVehiclesMutation.isPending}
            className="flex-1"
          >
            {assignVehiclesMutation.isPending ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleAssignmentDialog;
