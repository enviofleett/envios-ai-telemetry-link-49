
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SecureVehicleService } from '@/services/secureVehicleService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { VehicleData } from '@/types/vehicle';

interface VehicleEditModalProps {
  vehicle: VehicleData | null;
  isOpen: boolean;
  onClose: () => void;
  onVehicleUpdated: () => void;
  availableUsers?: Array<{ id: string; name: string; email: string }>;
}

interface VehicleFormData {
  gp51_device_id: string;
  name: string;
  user_id: string;
  sim_number: string;
}

export const VehicleEditModal: React.FC<VehicleEditModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onVehicleUpdated,
  availableUsers = []
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<VehicleFormData>({
    gp51_device_id: '',
    name: '',
    user_id: '',
    sim_number: ''
  });

  useEffect(() => {
    if (vehicle && isOpen) {
      setFormData({
        gp51_device_id: vehicle.device_id || '',
        name: vehicle.device_name || '',
        user_id: vehicle.user_id || '',
        sim_number: vehicle.sim_number || ''
      });
      setError('');
    }
  }, [vehicle, isOpen]);

  const handleInputChange = (field: keyof VehicleFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.gp51_device_id.trim()) {
      setError('Device ID is required');
      return false;
    }
    if (!formData.name.trim()) {
      setError('Vehicle name is required');
      return false;
    }
    if (formData.gp51_device_id.length < 3) {
      setError('Device ID must be at least 3 characters');
      return false;
    }
    if (formData.name.length < 2) {
      setError('Vehicle name must be at least 2 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!vehicle) return;
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await SecureVehicleService.updateSecureVehicle(vehicle.id, {
        gp51_device_id: formData.gp51_device_id.trim(),
        name: formData.name.trim(),
        user_id: formData.user_id || undefined,
        sim_number: formData.sim_number.trim() || undefined
      });

      if (result.success) {
        toast({
          title: "Vehicle Updated",
          description: "Vehicle has been successfully updated",
        });
        onVehicleUpdated();
        onClose();
      } else {
        setError(result.error || 'Failed to update vehicle');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Device ID */}
          <div className="space-y-2">
            <Label htmlFor="device_id">Device ID *</Label>
            <Input
              id="device_id"
              value={formData.gp51_device_id}
              onChange={(e) => handleInputChange('gp51_device_id', e.target.value)}
              placeholder="Enter device ID"
              disabled={isLoading}
              required
            />
          </div>

          {/* Vehicle Name */}
          <div className="space-y-2">
            <Label htmlFor="vehicle_name">Vehicle Name *</Label>
            <Input
              id="vehicle_name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter vehicle name"
              disabled={isLoading}
              required
            />
          </div>

          {/* User Assignment */}
          <div className="space-y-2">
            <Label htmlFor="user_assignment">Assigned User</Label>
            <Select 
              value={formData.user_id} 
              onValueChange={(value) => handleInputChange('user_id', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select user (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No assignment</SelectItem>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SIM Number */}
          <div className="space-y-2">
            <Label htmlFor="sim_number">SIM Number</Label>
            <Input
              id="sim_number"
              value={formData.sim_number}
              onChange={(e) => handleInputChange('sim_number', e.target.value)}
              placeholder="Enter SIM number (optional)"
              disabled={isLoading}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Updating...' : 'Update Vehicle'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleEditModal;
