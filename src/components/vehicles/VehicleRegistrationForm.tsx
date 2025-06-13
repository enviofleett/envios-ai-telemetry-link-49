
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { registerVehicle } from '@/lib/vehicleRegistrationActions';
import VinInput from './VinInput';
import { Loader2, Car, Fuel, Settings } from 'lucide-react';

interface VehicleFormData {
  userId: string;
  vin: string;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  color: string;
  fuelType: string;
  fuelTankCapacity?: number;
  manufacturerFuelConsumption?: number;
  subscriptionPackageId: string;
  gpsTypeId: string;
  simNumber: string;
  networkProviderId: string;
}

export default function VehicleRegistrationForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>({
    userId: '',
    vin: '',
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    fuelType: '',
    fuelTankCapacity: undefined,
    manufacturerFuelConsumption: undefined,
    subscriptionPackageId: '',
    gpsTypeId: '',
    simNumber: '',
    networkProviderId: ''
  });

  const handleVinDecoded = (decodedData: {
    make: string;
    model: string;
    year: string;
    engine?: string;
    fuelType?: string;
    bodyStyle?: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      make: decodedData.make || prev.make,
      model: decodedData.model || prev.model,
      year: parseInt(decodedData.year) || prev.year,
      fuelType: decodedData.fuelType || prev.fuelType
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          formDataObj.append(key, value.toString());
        }
      });

      const result = await registerVehicle(formDataObj);

      if (result.success) {
        toast({
          title: "Success",
          description: "Vehicle registered successfully"
        });
        
        // Reset form
        setFormData({
          userId: '',
          vin: '',
          plateNumber: '',
          make: '',
          model: '',
          year: new Date().getFullYear(),
          color: '',
          fuelType: '',
          fuelTankCapacity: undefined,
          manufacturerFuelConsumption: undefined,
          subscriptionPackageId: '',
          gpsTypeId: '',
          simNumber: '',
          networkProviderId: ''
        });
      } else {
        toast({
          title: "Registration Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Car className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Vehicle Registration</h1>
          <p className="text-sm text-muted-foreground">
            Register a new vehicle with automatic VIN decoding
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* VIN Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Vehicle Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <VinInput
              value={formData.vin}
              onChange={(value) => setFormData({ ...formData, vin: value })}
              onVinDecoded={handleVinDecoded}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">License Plate *</Label>
                <Input
                  id="plateNumber"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                  placeholder="Enter license plate number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">Assign to User *</Label>
                <Select value={formData.userId} onValueChange={(value) => setFormData({ ...formData, userId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user1">John Doe</SelectItem>
                    <SelectItem value="user2">Jane Smith</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              These fields are automatically populated when VIN is decoded
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g., Toyota"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., Camry"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Color *</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., White"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type *</Label>
                <Select value={formData.fuelType} onValueChange={(value) => setFormData({ ...formData, fuelType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasoline">Gasoline</SelectItem>
                    <SelectItem value="diesel">Diesel</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Fuel Configuration
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Optional: Add fuel tank capacity and manufacturer consumption data for analytics
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuelTankCapacity">Fuel Tank Capacity (Liters)</Label>
                <Input
                  id="fuelTankCapacity"
                  type="number"
                  step="0.1"
                  value={formData.fuelTankCapacity || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    fuelTankCapacity: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="e.g., 60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturerFuelConsumption">Manufacturer Fuel Consumption (L/100KM)</Label>
                <Input
                  id="manufacturerFuelConsumption"
                  type="number"
                  step="0.1"
                  value={formData.manufacturerFuelConsumption || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    manufacturerFuelConsumption: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                  placeholder="e.g., 8.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GPS Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle>GPS Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriptionPackageId">Subscription Package *</Label>
                <Select value={formData.subscriptionPackageId} onValueChange={(value) => setFormData({ ...formData, subscriptionPackageId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Plan</SelectItem>
                    <SelectItem value="premium">Premium Plan</SelectItem>
                    <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpsTypeId">GPS Device Type *</Label>
                <Select value={formData.gpsTypeId} onValueChange={(value) => setFormData({ ...formData, gpsTypeId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select GPS type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gps-1">Standard GPS</SelectItem>
                    <SelectItem value="gps-2">Advanced GPS</SelectItem>
                    <SelectItem value="gps-3">Premium GPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="simNumber">SIM Number *</Label>
                <Input
                  id="simNumber"
                  value={formData.simNumber}
                  onChange={(e) => setFormData({ ...formData, simNumber: e.target.value })}
                  placeholder="Enter SIM card number"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="networkProviderId">Network Provider *</Label>
                <Select value={formData.networkProviderId} onValueChange={(value) => setFormData({ ...formData, networkProviderId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="verizon">Verizon</SelectItem>
                    <SelectItem value="att">AT&T</SelectItem>
                    <SelectItem value="tmobile">T-Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering Vehicle...
            </>
          ) : (
            'Register Vehicle'
          )}
        </Button>
      </form>
    </div>
  );
}
