
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Phone, Mail, MapPin, Globe, Wrench } from 'lucide-react';

const serviceOptions = [
  'Maintenance',
  'Mechanical Repair',
  'Electrical Systems',
  'Diagnostics',
  'Oil Change',
  'Brake Service',
  'Tire Service',
  'Engine Repair',
  'Transmission',
  'Air Conditioning',
  'Body Work',
  'Paint Service'
];

const WorkshopSignup: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    representative_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    address: '',
    service_types: [] as string[],
    operating_hours: ''
  });

  const handleServiceTypeChange = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      service_types: checked 
        ? [...prev.service_types, service]
        : prev.service_types.filter(s => s !== service)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.service_types.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one service type",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('workshops')
        .insert({
          name: formData.name,
          representative_name: formData.representative_name,
          email: formData.email,
          phone: formData.phone,
          city: formData.city,
          country: formData.country,
          address: formData.address,
          service_types: formData.service_types,
          operating_hours: formData.operating_hours,
          verified: false,
          is_active: false // Requires admin approval
        })
        .select()
        .single();

      if (error) throw error;

      // Create workshop owner user
      await supabase
        .from('workshop_users')
        .insert({
          workshop_id: data.id,
          email: formData.email,
          name: formData.representative_name,
          role: 'owner',
          permissions: ['manage_staff', 'manage_settings', 'view_transactions', 'manage_inspections']
        });

      toast({
        title: "Registration Successful",
        description: "Your workshop has been registered and is pending approval. You'll receive an email confirmation once approved."
      });

      navigate('/workshop-login');
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register workshop",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building2 className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Workshop Registration</CardTitle>
          <CardDescription>
            Join our network of trusted automotive service providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Workshop Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Workshop Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workshop Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="representative_name">Representative Name *</Label>
                  <Input
                    id="representative_name"
                    value={formData.representative_name}
                    onChange={(e) => setFormData({...formData, representative_name: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    Country *
                  </Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="operating_hours">Operating Hours</Label>
                <Input
                  id="operating_hours"
                  placeholder="e.g., Mon-Fri: 8:00 AM - 6:00 PM"
                  value={formData.operating_hours}
                  onChange={(e) => setFormData({...formData, operating_hours: e.target.value})}
                />
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services Offered *</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {serviceOptions.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={formData.service_types.includes(service)}
                      onCheckedChange={(checked) => 
                        handleServiceTypeChange(service, checked as boolean)
                      }
                    />
                    <Label htmlFor={service} className="text-sm">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/workshop-login')}
                className="flex-1"
              >
                Already have an account?
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Registering...' : 'Register Workshop'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkshopSignup;
