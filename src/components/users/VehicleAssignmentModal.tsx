
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, useAssignVehicleToUser, useUnassignVehicleFromUser } from '@/hooks/useUserProfiles';
import { Car, Search, Plus, Minus } from 'lucide-react';

interface VehicleAssignmentModalProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Vehicle {
  id: string;
  device_id: string;
  device_name?: string;
  user_profile_id?: string;
  is_assigned: boolean;
}

export default function VehicleAssignmentModal({
  user,
  open,
  onOpenChange
}: VehicleAssignmentModalProps) {
  const [search, setSearch] = useState('');
  const assignVehicle = useAssignVehicleToUser();
  const unassignVehicle = useUnassignVehicleFromUser();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles-for-assignment', search],
    queryFn: async () => {
      let query = supabase
        .from('vehicles')
        .select('id, device_id, device_name, user_profile_id');

      if (search.trim()) {
        query = query.or(`device_id.ilike.%${search}%,device_name.ilike.%${search}%`);
      }

      const { data, error } = await query.order('device_id');
      
      if (error) throw error;

      return (data || []).map(vehicle => ({
        ...vehicle,
        is_assigned: vehicle.user_profile_id === user?.id
      }));
    },
    enabled: open && !!user,
  });

  const handleAssignVehicle = async (vehicleId: string) => {
    if (!user) return;
    
    await assignVehicle.mutateAsync({
      vehicleId,
      userId: user.id,
      reason: 'Manual assignment via admin panel'
    });
  };

  const handleUnassignVehicle = async (vehicleId: string) => {
    await unassignVehicle.mutateAsync({
      vehicleId,
      reason: 'Manual unassignment via admin panel'
    });
  };

  if (!user) return null;

  const assignedVehicles = vehicles?.filter(v => v.is_assigned) || [];
  const availableVehicles = vehicles?.filter(v => !v.user_profile_id) || [];
  const otherAssignedVehicles = vehicles?.filter(v => v.user_profile_id && !v.is_assigned) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Vehicle Assignments - {user.first_name} {user.last_name}
          </DialogTitle>
          <DialogDescription>
            Manage vehicle assignments for this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search vehicles by ID or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Currently Assigned Vehicles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Assigned Vehicles ({assignedVehicles.length})
            </h3>
            {assignedVehicles.length > 0 ? (
              <div className="space-y-2">
                {assignedVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-green-50"
                  >
                    <div className="flex items-center gap-3">
                      <Car className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="font-medium">
                          {vehicle.device_name || vehicle.device_id}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {vehicle.device_id}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnassignVehicle(vehicle.id)}
                      disabled={unassignVehicle.isPending}
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Unassign
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 border-2 border-dashed rounded-lg">
                No vehicles assigned
              </div>
            )}
          </div>

          {/* Available Vehicles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Available Vehicles ({availableVehicles.length})
            </h3>
            {availableVehicles.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Car className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {vehicle.device_name || vehicle.device_id}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {vehicle.device_id}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAssignVehicle(vehicle.id)}
                      disabled={assignVehicle.isPending}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 border-2 border-dashed rounded-lg">
                No unassigned vehicles available
              </div>
            )}
          </div>

          {/* Vehicles Assigned to Others */}
          {otherAssignedVehicles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Assigned to Others ({otherAssignedVehicles.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {otherAssignedVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <Car className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {vehicle.device_name || vehicle.device_id}
                        </div>
                        <div className="text-sm text-gray-600">
                          ID: {vehicle.device_id}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary">Assigned</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading vehicles...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
