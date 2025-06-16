
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VehicleData } from '@/types/vehicle';

interface UserMappingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: VehicleData[];
  onMappingSuccess: () => void;
}

interface GP51User {
  userId: string;
  username: string;
}

export const UserMappingDialog: React.FC<UserMappingDialogProps> = ({
  open,
  onOpenChange,
  vehicles,
  onMappingSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gp51Users, setGp51Users] = useState<GP51User[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedGP51User, setSelectedGP51User] = useState<GP51User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGP51Users = async () => {
      try {
        const { data, error } = await supabase
          .from('envio_users')
          .select('id, name');

        if (error) {
          console.error('Error fetching GP51 users:', error);
          toast({ title: 'Error', description: 'Could not fetch GP51 users.', variant: 'destructive' });
          return;
        }

        if (!data) {
          setGp51Users([]);
          return;
        }

        const mappedUsers: GP51User[] = data.map(user => ({
          userId: user.id,
          username: user.name,
        }));
        setGp51Users(mappedUsers);
      } catch (error) {
        console.error('Error fetching GP51 users:', error);
        toast({ title: 'Error', description: 'Could not fetch GP51 users.', variant: 'destructive' });
      }
    };

    fetchGP51Users();
  }, [toast]);

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.device_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMapVehicle = async () => {
    if (!selectedVehicleId || !selectedGP51User) return;

    try {
      setIsLoading(true);
      const vehicleToUpdate = vehicles.find(v => v.id === selectedVehicleId);
      if (!vehicleToUpdate) {
        toast({ title: 'Error', description: 'Selected vehicle not found.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('vehicles')
        .update({ user_id: selectedGP51User.userId })
        .eq('id', selectedVehicleId);

      if (error) {
        console.error('Error mapping vehicle:', error);
        toast({ title: 'Error', description: 'Could not map vehicle.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      toast({ title: 'Success', description: `Vehicle ${vehicleToUpdate.device_name} mapped to ${selectedGP51User.username}.` });
      onMappingSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error mapping vehicle:', error);
      toast({ title: 'Error', description: 'Could not map vehicle.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Map Vehicle to User</DialogTitle>
          <DialogDescription>
            Select a vehicle and a user to create a mapping.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicle">Vehicle</Label>
              <Input
                id="vehicle-search"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="col-span-3"
              />
              <ScrollArea className="h-[200px] rounded-md border p-2 mt-2">
                {filteredVehicles.map(vehicle => (
                  <Button
                    key={vehicle.id}
                    variant="outline"
                    className="w-full justify-start rounded-md hover:bg-secondary/50 data-[state=active]:bg-secondary/50"
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                    data-state={selectedVehicleId === vehicle.id ? 'active' : 'inactive'}
                  >
                    {vehicle.device_name}
                  </Button>
                ))}
              </ScrollArea>
            </div>
            <div>
              <Label htmlFor="gp51-user">User</Label>
              <Select onValueChange={(value) => {
                const user = gp51Users.find(u => u.userId === value);
                setSelectedGP51User(user || null);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {gp51Users.map(user => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleMapVehicle} disabled={isLoading || !selectedVehicleId || !selectedGP51User}>
            {isLoading ? 'Mapping...' : 'Map Vehicle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
