
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedVehicleRegistrationProps {
  onSuccess?: (vehicleId: string) => void;
}

const EnhancedVehicleRegistration: React.FC<EnhancedVehicleRegistrationProps> = ({
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deviceId: '',
    deviceName: '',
    simNumber: '',
    userId: ''
  });
  const { toast } = useToast();

  // Fetch users for the dropdown
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-for-registration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('envio_users')
        .select('id, name, email')
        .order('name');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      return data || [];
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSelect = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      userId
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

      // Create vehicle record
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          gp51_device_id: formData.deviceId,
          name: formData.deviceName,
          sim_number: formData.simNumber || null,
          user_id: formData.userId
        })
        .select()
        .single();

      if (vehicleError) {
        console.error('Error creating vehicle:', vehicleError);
        toast({
          title: 'Registration Failed',
          description: vehicleError.message || 'Failed to register vehicle',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Vehicle registered successfully',
      });
      
      // Reset form
      setFormData({
        deviceId: '',
        deviceName: '',
        simNumber: '',
        userId: ''
      });

      if (onSuccess && vehicleData) {
        onSuccess(vehicleData.id);
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
            <Label htmlFor="userId">Assign to User *</Label>
            <Select value={formData.userId} onValueChange={handleUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            disabled={isSubmitting || isLoadingUsers}
          >
            {isSubmitting ? 'Registering...' : 'Register Vehicle'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedVehicleRegistration;
