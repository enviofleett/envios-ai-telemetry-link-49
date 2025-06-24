import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from '@/hooks/use-toast';
import type { VehicleData, VehicleDbRecord } from '@/types/vehicle';

interface VehicleAssignmentDialogProps {
  user: {
    id: string;
    email: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VehicleAssignmentDialog: React.FC<VehicleAssignmentDialogProps> = ({ user, open, onOpenChange }) => {
  const [userVehicles, setUserVehicles] = useState<VehicleData[]>([]);
  const [unassignedVehicles, setUnassignedVehicles] = useState<VehicleData[]>([]);
  const { toast } = useToast();

  const mapDbToDisplay = (dbVehicle: VehicleDbRecord): VehicleData => ({
    id: dbVehicle.id,
    device_id: dbVehicle.gp51_device_id,
    device_name: dbVehicle.name,
    name: dbVehicle.name, // FIXED: Add the required name property
    user_id: dbVehicle.user_id,
    sim_number: dbVehicle.sim_number,
    created_at: dbVehicle.created_at,
    updated_at: dbVehicle.updated_at,
    status: 'offline', // default
    is_active: false, // default
    isOnline: false,
    isMoving: false,
    alerts: [],
    lastUpdate: new Date(dbVehicle.updated_at),
  });

  const fetchUnassignedVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id, sim_number, created_at, updated_at')
        .is('user_id', null);
      if (error) {
        console.error('Error fetching unassigned vehicles:', error);
        toast({ title: 'Error', description: 'Could not fetch unassigned vehicles.', variant: 'destructive' });
        setUnassignedVehicles([]);
        return;
      }
      if (!data) {
        setUnassignedVehicles([]);
        return;
      }
      const dbRecords: VehicleDbRecord[] = data as VehicleDbRecord[];
      setUnassignedVehicles(dbRecords.map(mapDbToDisplay));
    } catch (error) {
      console.error('Error fetching unassigned vehicles:', error);
      toast({ title: 'Error', description: 'Could not fetch unassigned vehicles.', variant: 'destructive' });
      setUnassignedVehicles([]);
    }
  };

  const fetchUserVehicles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id, sim_number, created_at, updated_at')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user vehicles:', error);
        toast({ title: 'Error', description: 'Could not fetch user vehicles.', variant: 'destructive' });
        return;
      }
      if (!data) {
        setUserVehicles([]);
        return;
      }
      const dbRecords: VehicleDbRecord[] = data as VehicleDbRecord[];
      setUserVehicles(dbRecords.map(mapDbToDisplay));
    } catch (error) {
      console.error('Error fetching user vehicles:', error);
      toast({ title: 'Error', description: 'Could not fetch user vehicles.', variant: 'destructive' });
    }
  };

  const handleAssign = async (vehicleId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: user.id })
        .eq('id', vehicleId);
      if (error) {
        console.error('Error assigning vehicle:', error);
        toast({ title: 'Error', description: 'Could not assign vehicle.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Success', description: 'Vehicle assigned successfully.' });
      fetchUnassignedVehicles();
      fetchUserVehicles(user.id);
    } catch (error) {
      console.error('Error assigning vehicle:', error);
      toast({ title: 'Error', description: 'Could not assign vehicle.', variant: 'destructive' });
    }
  };

  const handleUnassign = async (vehicleId: string) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: null })
        .eq('id', vehicleId);
      if (error) {
        console.error('Error unassigning vehicle:', error);
        toast({ title: 'Error', description: 'Could not unassign vehicle.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Success', description: 'Vehicle unassigned successfully.' });
      fetchUnassignedVehicles();
      if (user) {
        fetchUserVehicles(user.id);
      }
    } catch (error) {
      console.error('Error unassigning vehicle:', error);
      toast({ title: 'Error', description: 'Could not unassign vehicle.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (open) {
      fetchUnassignedVehicles();
      if (user) {
        fetchUserVehicles(user.id);
      }
    }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Vehicle Assignment</DialogTitle>
          <DialogDescription>
            Assign or unassign vehicles for user: {user?.email}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Unassigned Vehicles</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                {unassignedVehicles.length > 0 ? (
                  <ul className="list-none p-0">
                    {unassignedVehicles.map((vehicle) => (
                      <li key={vehicle.id} className="py-2 border-b last:border-b-0">
                        {vehicle.device_name}
                        <Button variant="secondary" size="sm" className="float-right" onClick={() => handleAssign(vehicle.id)}>
                          Assign
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No unassigned vehicles.</p>
                )}
              </ScrollArea>
            </div>
            <div>
              <Label>User Vehicles</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                {userVehicles.length > 0 ? (
                  <ul className="list-none p-0">
                    {userVehicles.map((vehicle) => (
                      <li key={vehicle.id} className="py-2 border-b last:border-b-0">
                        {vehicle.device_name}
                        <Button variant="secondary" size="sm" className="float-right" onClick={() => handleUnassign(vehicle.id)}>
                          Unassign
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No vehicles assigned to this user.</p>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
