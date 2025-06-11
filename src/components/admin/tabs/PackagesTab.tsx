
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react';

const PackagesTab: React.FC = () => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const packages = [
    {
      id: 'basic',
      name: 'Basic Fleet',
      description: 'Essential vehicle tracking for small fleets',
      price: 29.99,
      billingCycle: 'monthly',
      features: ['GPS Tracking', 'Basic Reports', 'Email Alerts'],
      status: 'active',
      vehicles: 25
    },
    {
      id: 'professional',
      name: 'Professional Fleet',
      description: 'Advanced features for growing businesses',
      price: 79.99,
      billingCycle: 'monthly',
      features: ['GPS Tracking', 'Advanced Reports', 'Geofencing', 'Driver Management'],
      status: 'active',
      vehicles: 100
    },
    {
      id: 'enterprise',
      name: 'Enterprise Fleet',
      description: 'Complete solution for large organizations',
      price: 199.99,
      billingCycle: 'monthly',
      features: ['All Features', 'API Access', 'Custom Integrations', 'Priority Support'],
      status: 'active',
      vehicles: 500
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Package Management
          </CardTitle>
          <CardDescription>
            Manage subscription packages and pricing plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-muted-foreground">
              {packages.length} packages available
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Package
            </Button>
          </div>

          <div className="grid gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{pkg.name}</h3>
                        <Badge variant="default">{pkg.status}</Badge>
                        <Badge variant="outline">
                          Up to {pkg.vehicles} vehicles
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{pkg.description}</p>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Features</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {pkg.features.map((feature, index) => (
                              <li key={index}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Pricing</h4>
                          <div className="text-2xl font-bold text-primary">
                            ${pkg.price}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{pkg.billingCycle}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PackagesTab;
