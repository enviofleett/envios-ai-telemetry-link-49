
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package as PackageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Package, RegistrationRequest } from '@/types/registration';

const PackageSelectionForm: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    company_name: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('packages-api');
      
      if (error) throw error;
      
      setPackages(data.packages || []);
    } catch (error) {
      console.error('Error loading packages:', error);
      toast({
        title: "Error",
        description: "Failed to load available packages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPackage) {
      toast({
        title: "Package Required",
        description: "Please select a package before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const registrationData: RegistrationRequest = {
        ...formData,
        selected_package_id: selectedPackage
      };

      const { data, error } = await supabase.functions.invoke('register-user', {
        body: registrationData
      });

      if (error) throw error;

      toast({
        title: "Registration Submitted",
        description: data.message,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone_number: '',
        company_name: ''
      });
      setSelectedPackage('');

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to submit registration request",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Choose Your Package</h1>
        <p className="text-muted-foreground">
          Select a package that best fits your fleet management needs
        </p>
      </div>

      {/* Package Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => (
          <Card 
            key={pkg.id} 
            className={`cursor-pointer transition-all ${
              selectedPackage === pkg.id 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedPackage(pkg.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PackageIcon className="h-5 w-5" />
                  {pkg.name}
                </CardTitle>
                {selectedPackage === pkg.id && (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    ${pkg.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{pkg.billing_cycle}
                    </span>
                  </span>
                  <Badge variant="outline">
                    {pkg.max_vehicles ? `Up to ${pkg.max_vehicles} vehicles` : 'Unlimited vehicles'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Registration Form */}
      {selectedPackage && (
        <Card>
          <CardHeader>
            <CardTitle>Registration Information</CardTitle>
            <CardDescription>
              Please provide your details to complete the registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Registration Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PackageSelectionForm;
