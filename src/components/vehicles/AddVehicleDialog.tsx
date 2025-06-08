
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface AddVehicleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddVehicleDialog: React.FC<AddVehicleDialogProps> = ({ isOpen, onClose }) => {
  const handleSubmit = () => {
    // TODO: Implement vehicle creation
    console.log('Creating new vehicle...');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Vehicle</DialogTitle>
          <DialogDescription>Enter the details of the new vehicle to add to your fleet.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Vehicle ID</label>
            <Input placeholder="e.g. VH-1234" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Plate Number</label>
            <Input placeholder="e.g. ABC-123" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Make</label>
            <Input placeholder="e.g. Ford" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Input placeholder="e.g. Transit" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <Input type="number" placeholder="e.g. 2023" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Vehicle Type</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="van">Van</SelectItem>
                <SelectItem value="truck">Truck</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
                <SelectItem value="car">Car</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Fuel Type</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select fuel type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diesel">Diesel</SelectItem>
                <SelectItem value="petrol">Petrol</SelectItem>
                <SelectItem value="electric">Electric</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Initial Odometer</label>
            <Input type="number" placeholder="e.g. 0" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Registration Expiry</label>
            <Input type="date" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Insurance Expiry</label>
            <Input type="date" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Vehicle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
