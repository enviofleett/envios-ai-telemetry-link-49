
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { VehicleData } from '@/types/vehicle';

interface VehicleAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onAssignmentComplete: () => void;
}

const VehicleAssignmentDialog: React.FC<VehicleAssignmentDialogProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  onAssignmentComplete
}) => {
  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadVehicles();
    }
  }, [isOpen]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, gp51_device_id, name, user_id')
        .order('name');

      if (error) throw error;

      const vehicleData: VehicleData[] = (data || []).map(vehicle => ({
        id: vehicle.id,
        device_id: vehicle.gp51_device_id,
        gp51_device_id: vehicle.gp51_device_id, // Added missing property
        device_name: vehicle.name,
        name: vehicle.name,
        user_id: vehicle.user_id,
        sim_number: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: 'offline',
        is_active: false,
        isOnline: false,
        isMoving: false,
        alerts: [],
        lastUpdate: new Date()
      }));

      setVehicles(vehicleData);
      setSelectedVehicles(vehicleData.filter(v => v.user_id === userId).map(v => v.id));
    } catch (error) {
      console.error('Error loading vehicles:', error);
      toast({
        title: "Error",
        description: "Failed to load vehicles",
        variant: "destructive"
      });
    }
  };

  const handleVehicleToggle = (vehicleId: string) => {
    setSelectedVehicles(prev => 
      prev.includes(vehicleId) 
        ? prev.filter(id => id !== vehicleId)
        : [...prev, vehicleId]
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // First, unassign all vehicles from this user
      await supabase
        .from('vehicles')
        .update({ user_id: null })
        .eq('user_id', userId);

      // Then assign selected vehicles
      if (selectedVehicles.length > 0) {
        await supabase
          .from('vehicles')
          .update({ user_id: userId })
          .in('id', selectedVehicles);
      }

      toast({
        title: "Success",
        description: `Vehicle assignments updated for ${userName}`
      });

      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error updating assignments:', error);
      toast({
        title: "Error",
        description: "Failed to update vehicle assignments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Vehicles to {userName}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-2">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="flex items-center space-x-2">
                <Checkbox
                  id={vehicle.id}
                  checked={selectedVehicles.includes(vehicle.id)}
                  onCheckedChange={() => handleVehicleToggle(vehicle.id)}
                />
                <Label htmlFor={vehicle.id} className="flex-1">
                  {vehicle.device_name} ({vehicle.device_id})
                  {vehicle.user_id && vehicle.user_id !== userId && (
                    <span className="text-sm text-muted-foreground ml-2">
                      (Currently assigned)
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleAssignmentDialog;
