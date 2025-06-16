
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { VehicleRegistrationActions, type VehicleRegistrationData } from '@/lib/vehicleRegistrationActions';

interface VehicleRegistrationFormProps {
  onSuccess?: (vehicleId: string) => void;
  userId?: string;
}

const VehicleRegistrationForm: React.FC<VehicleRegistrationFormProps> = ({
  onSuccess,
  userId = ''
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceName: '',
    simNumber: '',
    userId: userId
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.deviceId || !formData.deviceName || !formData.userId) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Transform FormData to VehicleRegistrationData
      const registrationData: VehicleRegistrationData = {
        deviceId: formData.deviceId,
        deviceName: formData.deviceName,
        userId: formData.userId,
        simNumber: formData.simNumber || undefined
      };

      const result = await VehicleRegistrationActions.registerVehicle(registrationData);

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Vehicle registered successfully',
        });
        
        // Reset form
        setFormData({
          deviceId: '',
          deviceName: '',
          simNumber: '',
          userId: userId
        });

        if (onSuccess && result.vehicleId) {
          onSuccess(result.vehicleId);
        }
      } else {
        toast({
          title: 'Registration Failed',
          description: result.error || 'Failed to register vehicle',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register New Vehicle</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="deviceId">Device ID *</Label>
            <Input
              id="deviceId"
              name="deviceId"
              value={formData.deviceId}
              onChange={handleInputChange}
              placeholder="Enter device ID"
              required
            />
          </div>

          <div>
            <Label htmlFor="deviceName">Device Name *</Label>
            <Input
              id="deviceName"
              name="deviceName"
              value={formData.deviceName}
              onChange={handleInputChange}
              placeholder="Enter vehicle name"
              required
            />
          </div>

          <div>
            <Label htmlFor="userId">User ID *</Label>
            <Input
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleInputChange}
              placeholder="Enter user ID"
              required
            />
          </div>

          <div>
            <Label htmlFor="simNumber">SIM Number</Label>
            <Input
              id="simNumber"
              name="simNumber"
              value={formData.simNumber}
              onChange={handleInputChange}
              placeholder="Enter SIM number (optional)"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Registering...' : 'Register Vehicle'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VehicleRegistrationForm;
